import { NodeEditor } from 'rete';
import { BaseNode } from '../core/BaseNode';
import { NodeInput, NodeOutput, NodeControl } from '../types/node.types';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class LLMAgentNode extends BaseNode {
  private static readonly DEFAULT_MODEL = 'gpt-3.5-turbo';
  private static readonly DEFAULT_TEMPERATURE = 0.7;
  private static readonly DEFAULT_MAX_TOKENS = 1000;

  private apiKey: string = '';
  private model: string = LLMAgentNode.DEFAULT_MODEL;
  private temperature: number = LLMAgentNode.DEFAULT_TEMPERATURE;
  private maxTokens: number = LLMAgentNode.DEFAULT_MAX_TOKENS;
  private systemPrompt: string = 'You are a helpful AI assistant.';
  private messages: OpenAIMessage[] = [];

  constructor(editor: NodeEditor) {
    super(editor, 'llm-agent', 'LLM Agent');
    this.initializeMessages();
  }

  private initializeMessages() {
    this.messages = [
      {
        role: 'system',
        content: this.systemPrompt,
      },
    ];
  }

  getInputs(): NodeInput[] {
    return [
      { 
        name: 'input', 
        type: 'any', 
        description: 'Input to send to the LLM',
        required: true
      },
      { 
        name: 'systemPrompt', 
        type: 'string', 
        description: 'System prompt to guide the LLM behavior',
        required: false
      },
    ];
  }

  getOutputs(): NodeOutput[] {
    return [
      { 
        name: 'output', 
        type: 'string', 
        description: 'LLM generated response' 
      },
      { 
        name: 'usage', 
        type: 'object', 
        description: 'Token usage information' 
      },
    ];
  }

  getControls(): NodeControl[] {
    return [
      {
        type: 'password',
        key: 'apiKey',
        label: 'OpenAI API Key',
        placeholder: 'sk-...',
        value: this.apiKey,
        onChange: (value: string) => {
          this.apiKey = value.trim();
          this.update();
        },
      },
      {
        type: 'select',
        key: 'model',
        label: 'Model',
        options: [
          { value: 'gpt-4', label: 'GPT-4' },
          { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
          { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
          { value: 'gpt-3.5-turbo-16k', label: 'GPT-3.5 Turbo 16K' },
        ],
        value: this.model,
        onChange: (value: string) => {
          this.model = value;
          this.update();
        },
      },
      {
        type: 'slider',
        key: 'temperature',
        label: 'Temperature',
        min: 0,
        max: 2,
        step: 0.1,
        value: this.temperature,
        onChange: (value: number) => {
          this.temperature = value;
          this.update();
        },
      },
      {
        type: 'number',
        key: 'maxTokens',
        label: 'Max Tokens',
        min: 1,
        max: 4096,
        value: this.maxTokens,
        onChange: (value: number) => {
          this.maxTokens = Math.min(4096, Math.max(1, value));
          this.update();
        },
      },
      {
        type: 'textarea',
        key: 'systemPrompt',
        label: 'System Prompt',
        placeholder: 'You are a helpful assistant...',
        value: this.systemPrompt,
        onChange: (value: string) => {
          this.systemPrompt = value;
          this.initializeMessages();
          this.update();
        },
      },
    ];
  }

  private async callOpenAI(messages: OpenAIMessage[]) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.log('Sending request to OpenAI API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.systemPrompt,
          },
          ...messages,
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`
      );
    }

    const data = await response.json();
    return data;
  }

  protected async executeNode(
    inputs: Record<string, any>,
    context: any
  ): Promise<Record<string, any>> {
    const input = inputs.input;
    const systemPrompt = inputs.systemPrompt || this.systemPrompt;

    if (systemPrompt !== this.systemPrompt) {
      this.systemPrompt = systemPrompt;
      this.initializeMessages();
    }

    if (!input) {
      throw new Error('Input is required');
    }

    // Add user message to conversation history
    const userMessage: OpenAIMessage = {
      role: 'user',
      content: typeof input === 'string' ? input : JSON.stringify(input),
    };

    this.messages.push(userMessage);
    this.log('Sending to LLM: ' + userMessage.content.substring(0, 100) + '...');

    try {
      const response = await this.callOpenAI(this.messages);
      
      const assistantMessage = response.choices[0].message;
      this.messages.push(assistantMessage);

      this.log(`Received response (${response.usage.total_tokens} tokens used)`);
      
      return {
        output: assistantMessage.content,
        usage: response.usage,
      };
    } catch (error) {
      this.log(`Error calling OpenAI: ${error.message}`);
      throw error;
    }
  }

  async clearConversation() {
    this.messages = [];
    this.initializeMessages();
    this.log('Conversation history cleared');
    this.update();
  }

  async onCreated() {
    super.onCreated();
    this.log('LLM Agent Node created');
  }

  async onDestroy() {
    this.log('LLM Agent Node destroyed');
    super.onDestroy();
  }
}
