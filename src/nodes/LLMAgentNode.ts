import { ClassicPreset, NodeEditor } from 'rete';
import { AreaPlugin } from 'rete-area-plugin';
import { BaseNode, NodeScheme } from '../core/BaseNode';
import { NodeContext } from '../types/node.types';
import { mockLLMRequest, isMockMode } from '../utils/mockLLM';
import { ButtonControl } from '../core/Control';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

type NodeData = {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  apiKey: string;
  messages: OpenAIMessage[];
}

const socket = new ClassicPreset.Socket('socket');

export class LLMAgentNode extends BaseNode<NodeData> {
  constructor(editor: NodeEditor<NodeScheme>, area: AreaPlugin<NodeScheme, any>) {
    super(editor, area, 'llm-agent', 'LLM Agent', {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 1000,
      systemPrompt: 'You are a helpful AI assistant.',
      apiKey: '',
      messages: [],
    });
    this.initializeMessages();

    this.addInput('input', new ClassicPreset.Input(socket, 'Input', true));
    this.addInput('systemPrompt', new ClassicPreset.Input(socket, 'System Prompt'));

    this.addOutput('output', new ClassicPreset.Output(socket, 'Output'));
    this.addOutput('usage', new ClassicPreset.Output(socket, 'Usage'));

    this.addControl('apiKey', new ClassicPreset.InputControl('text', {
      initial: this.data.apiKey, change: (value) => { this.data.apiKey = value; this.update(); }
    }));
    this.addControl('model', new ClassicPreset.InputControl('text', {
      initial: this.data.model, change: (value) => { this.data.model = value; this.update(); }
    }));
    this.addControl('temperature', new ClassicPreset.InputControl('number', {
      initial: this.data.temperature, change: (value) => { this.data.temperature = value; this.update(); }
    }));
    this.addControl('maxTokens', new ClassicPreset.InputControl('number', {
      initial: this.data.maxTokens, change: (value) => { this.data.maxTokens = value; this.update(); }
    }));
    this.addControl('systemPrompt', new ClassicPreset.InputControl('text', {
      initial: this.data.systemPrompt, change: (value) => { this.data.systemPrompt = value; this.initializeMessages(); this.update(); }
    }));
    this.addControl('clear', new ButtonControl('Clear Conversation', () => this.clearConversation()));
  }

  private initializeMessages() {
    this.data.messages = [{ role: 'system', content: this.data.systemPrompt }];
  }

  private async callOpenAI(messages: OpenAIMessage[]) {
    if (!this.data.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.info('Sending request to OpenAI API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.data.apiKey}`,
      },
      body: JSON.stringify({
        model: this.data.model,
        messages,
        temperature: this.data.temperature,
        max_tokens: this.data.maxTokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`
      );
    }

    return response.json();
  }

  async executeNode(
    inputs: { input?: any[], systemPrompt?: string[] },
    context: NodeContext
  ): Promise<{ output: string, usage: object }> {
    const input = inputs.input?.[0];
    const systemPrompt = inputs.systemPrompt?.[0] || this.data.systemPrompt;

    if (systemPrompt !== this.data.systemPrompt) {
      this.data.systemPrompt = systemPrompt;
      this.initializeMessages();
    }

    if (!input) {
      this.warn('Input is required');
      return { output: '', usage: {} };
    }

    const userMessage: OpenAIMessage = {
      role: 'user',
      content: typeof input === 'string' ? input : JSON.stringify(input),
    };

    this.data.messages.push(userMessage);
    this.info('Sending to LLM: ' + userMessage.content.substring(0, 100) + '...');

    try {
      if (isMockMode() && !this.data.apiKey) {
        this.info('⚠️ Using mock LLM mode - no API key provided');
        const response = await mockLLMRequest(input, systemPrompt);
        return {
          output: response,
          usage: {
            prompt_tokens: Math.floor(input.length / 4),
            completion_tokens: Math.floor(response.length / 4),
            total_tokens: Math.floor((input.length + response.length) / 4)
          }
        };
      }

      const response = await this.callOpenAI(this.data.messages);
      const assistantMessage = response.choices[0].message;
      this.data.messages.push(assistantMessage);

      this.info(`Received response (${response.usage.total_tokens} tokens used)`);
      
      return {
        output: assistantMessage.content,
        usage: response.usage,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.error(`Error calling OpenAI: ${errorMessage}`);
      throw error;
    }
  }

  clearConversation() {
    this.initializeMessages();
    this.info('Conversation history cleared');
    this.update();
  }
}
