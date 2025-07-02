import { NodeEditor } from 'rete';
import { BaseNode } from '../core/BaseNode';
import { NodeInput, NodeOutput, NodeControl } from '../types/node.types';

export class SummarizerNode extends BaseNode {
  private summaryLength: 'short' | 'medium' | 'long' = 'medium';
  private focusPoints: string = '';
  private language: string = 'english';
  private format: 'paragraph' | 'bullet' | 'numbered' = 'paragraph';

  constructor(editor: NodeEditor) {
    super(editor, 'summarizer', 'Text Summarizer');
  }

  getInputs(): NodeInput[] {
    return [
      { 
        name: 'text', 
        type: 'string', 
        description: 'Text content to summarize',
        required: true
      },
      { 
        name: 'focus', 
        type: 'string', 
        description: 'Optional focus points or key aspects to emphasize in the summary',
        required: false
      },
    ];
  }

  getOutputs(): NodeOutput[] {
    return [
      { 
        name: 'summary', 
        type: 'string', 
        description: 'Generated summary' 
      },
      { 
        name: 'length', 
        type: 'number', 
        description: 'Character count of the generated summary' 
      },
    ];
  }

  getControls(): NodeControl[] {
    return [
      {
        type: 'select',
        key: 'summaryLength',
        label: 'Summary Length',
        options: [
          { value: 'short', label: 'Short (1-2 sentences)' },
          { value: 'medium', label: 'Medium (3-5 sentences)' },
          { value: 'long', label: 'Long (5+ sentences)' },
        ],
        value: this.summaryLength,
        onChange: (value: 'short' | 'medium' | 'long') => {
          this.summaryLength = value;
          this.update();
        },
      },
      {
        type: 'select',
        key: 'format',
        label: 'Format',
        options: [
          { value: 'paragraph', label: 'Paragraph' },
          { value: 'bullet', label: 'Bullet Points' },
          { value: 'numbered', label: 'Numbered List' },
        ],
        value: this.format,
        onChange: (value: 'paragraph' | 'bullet' | 'numbered') => {
          this.format = value;
          this.update();
        },
      },
      {
        type: 'text',
        key: 'focusPoints',
        label: 'Focus Points',
        placeholder: 'Comma-separated key points to focus on',
        value: this.focusPoints,
        onChange: (value: string) => {
          this.focusPoints = value;
          this.update();
        },
      },
      {
        type: 'text',
        key: 'language',
        label: 'Language',
        placeholder: 'e.g., english, spanish, french',
        value: this.language,
        onChange: (value: string) => {
          this.language = value.trim().toLowerCase();
          this.update();
        },
      },
    ];
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

    let prompt = `Please provide a summary of the following text in ${lengthMap[this.summaryLength]} `;
    prompt += `as ${formatMap[this.format]}. `;
    
    if (focus) {
      prompt += `Focus on these aspects: ${focus}. `;
    }
    
    prompt += `The summary should be in ${this.language}.\n\n`;
    prompt += `Text to summarize:\n${text}`;
    
    return prompt;
  }

  protected async executeNode(
    inputs: Record<string, any>,
    context: any
  ): Promise<Record<string, any>> {
    const text = inputs.text;
    const focus = inputs.focus || this.focusPoints;
    
    if (!text) {
      throw new Error('Text input is required for summarization');
    }

    this.log(`Generating ${this.summaryLength} summary (${this.format} format)`);
    
    try {
      // In a real implementation, this would call an LLM service
      // For now, we'll simulate a simple summary
      const prompt = this.buildPrompt(text, focus);
      
      // This is where you would integrate with an LLM service
      // For example: const summary = await llmService.generate(prompt);
      
      // Simulated response
      const summary = `[Summary placeholder] This is a simulated ${this.summaryLength} summary in ${this.format} format. ` +
                     `The original text was ${text.length} characters long.`;
      
      this.log('Summary generated successfully');
      
      return {
        summary,
        length: summary.length,
      };
    } catch (error) {
      this.log(`Error generating summary: ${error.message}`);
      throw error;
    }
  }

  async onCreated() {
    super.onCreated();
    this.log('Summarizer Node created');
  }

  async onDestroy() {
    this.log('Summarizer Node destroyed');
    super.onDestroy();
  }
}
