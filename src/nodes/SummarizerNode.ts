import { ClassicPreset, NodeEditor } from 'rete';
import { AreaPlugin } from 'rete-area-plugin';
import { BaseNode, NodeScheme } from '../core/BaseNode';
import { NodeContext } from '../types/node.types';

type SummaryLength = 'short' | 'medium' | 'long';
type SummaryFormat = 'paragraph' | 'bullet' | 'numbered';

type NodeData = {
  summaryLength: SummaryLength;
  focusPoints: string;
  language: string;
  format: SummaryFormat;
}

const socket = new ClassicPreset.Socket('socket');

export class SummarizerNode extends BaseNode<NodeData> {
  constructor(editor: NodeEditor<NodeScheme>, area: AreaPlugin<NodeScheme, any>) {
    super(editor, area, 'summarizer', 'Text Summarizer', {
      summaryLength: 'medium',
      focusPoints: '',
      language: 'english',
      format: 'paragraph',
    });

    this.addInput('text', new ClassicPreset.Input(socket, 'Text', true));
    this.addInput('focus', new ClassicPreset.Input(socket, 'Focus'));

    this.addOutput('summary', new ClassicPreset.Output(socket, 'Summary'));
    this.addOutput('length', new ClassicPreset.Output(socket, 'Length'));

    // In a real app, these would be custom select controls
    this.addControl('summaryLength', new ClassicPreset.InputControl('text', {
      initial: this.data.summaryLength,
      change: (value) => {
        this.data.summaryLength = value as SummaryLength;
        this.update();
      }
    }));

    this.addControl('format', new ClassicPreset.InputControl('text', {
      initial: this.data.format,
      change: (value) => {
        this.data.format = value as SummaryFormat;
        this.update();
      }
    }));

    this.addControl('focusPoints', new ClassicPreset.InputControl('text', {
      initial: this.data.focusPoints,
      change: (value) => {
        this.data.focusPoints = value;
        this.update();
      }
    }));

    this.addControl('language', new ClassicPreset.InputControl('text', {
      initial: this.data.language,
      change: (value) => {
        this.data.language = value;
        this.update();
      }
    }));
  }

  private buildPrompt(text: string, focus: string = ''): string {
    const lengthMap = {
      short: '1-2 sentences',
      medium: '3-5 sentences',
      long: '5+ sentences',
    };

    const formatMap = {
      paragraph: 'a clear, coherent paragraph',
      bullet: 'bullet points',
      numbered: 'a numbered list',
    };

    let prompt = `Please provide a summary of the following text in ${lengthMap[this.data.summaryLength]} `;
    prompt += `as ${formatMap[this.data.format]}. `;
    
    if (focus) {
      prompt += `Focus on these aspects: ${focus}. `;
    }
    
    prompt += `The summary should be in ${this.data.language}.\n\n`;
    prompt += `Text to summarize:\n${text}`;
    
    return prompt;
  }

  async executeNode(
    inputs: { text?: string[], focus?: string[] },
    context: NodeContext
  ): Promise<{ summary: string, length: number }> {
    const text = inputs.text?.[0];
    const focus = inputs.focus?.[0] || this.data.focusPoints;
    
    if (!text) {
      this.warn('Text input is required for summarization');
      return { summary: '', length: 0 };
    }

    this.info(`Generating ${this.data.summaryLength} summary (${this.data.format} format)`);
    
    try {
      // In a real implementation, this would call an LLM service
      const prompt = this.buildPrompt(text, focus);
      
      // Simulated response
      const summary = `[Summary placeholder] This is a simulated ${this.data.summaryLength} summary in ${this.data.format} format. ` +
                     `The original text was ${text.length} characters long.`;
      
      this.info('Summary generated successfully');
      
      return {
        summary,
        length: summary.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.error(`Error generating summary: ${errorMessage}`);
      throw error;
    }
  }
}
