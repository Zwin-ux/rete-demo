import { NodeEditor } from 'rete';
import { BaseNode } from '../core/BaseNode';
import { NodeInput, NodeOutput, NodeControl } from '../types/node.types';

interface DiscordWebhookPayload {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: Array<{
    title?: string;
    description?: string;
    url?: string;
    color?: number;
    fields?: Array<{
      name: string;
      value: string;
      inline?: boolean;
    }>;
    timestamp?: string;
  }>;
  allowed_mentions?: {
    parse?: string[];
    users?: string[];
    roles?: string[];
  };
}

export class DiscordWebhookNode extends BaseNode {
  private webhookUrl: string = '';
  private username: string = 'Rete Bot';
  private avatarUrl: string = '';
  private useEmbed: boolean = true;
  private embedColor: string = '#5865F2';
  private testMessage: string = 'Test message from Rete.js Discord Webhook Node';
  private lastStatus: { success: boolean; message: string; timestamp: number } | null = null;

  constructor(editor: NodeEditor) {
    super(editor, 'discord-webhook', 'Discord Webhook');
  }

  getInputs(): NodeInput[] {
    return [
      { 
        name: 'message', 
        type: 'string', 
        description: 'Message content to send',
        required: false
      },
      { 
        name: 'title', 
        type: 'string', 
        description: 'Title for the embed',
        required: false
      },
      { 
        name: 'url', 
        type: 'string', 
        description: 'URL to include in the embed',
        required: false
      },
      { 
        name: 'trigger', 
        type: 'event', 
        description: 'Trigger to send the message',
        required: false
      },
    ];
  }

  getOutputs(): NodeOutput[] {
    return [
      { 
        name: 'success', 
        type: 'boolean', 
        description: 'Whether the message was sent successfully' 
      },
      { 
        name: 'response', 
        type: 'object', 
        description: 'Raw response from Discord API' 
      },
    ];
  }

  getControls(): NodeControl[] {
    return [
      {
        type: 'text',
        key: 'webhookUrl',
        label: 'Webhook URL',
        placeholder: 'https://discord.com/api/webhooks/...',
        value: this.webhookUrl,
        onChange: (value: string) => {
          this.webhookUrl = value.trim();
          this.update();
        },
      },
      {
        type: 'text',
        key: 'username',
        label: 'Username',
        placeholder: 'Webhook username',
        value: this.username,
        onChange: (value: string) => {
          this.username = value;
          this.update();
        },
      },
      {
        type: 'text',
        key: 'avatarUrl',
        label: 'Avatar URL',
        placeholder: 'https://...',
        value: this.avatarUrl,
        onChange: (value: string) => {
          this.avatarUrl = value.trim();
          this.update();
        },
      },
      {
        type: 'toggle',
        key: 'useEmbed',
        label: 'Use Embed',
        value: this.useEmbed,
        onChange: (value: boolean) => {
          this.useEmbed = value;
          this.update();
        },
      },
      {
        type: 'color',
        key: 'embedColor',
        label: 'Embed Color',
        value: this.embedColor,
        disabled: !this.useEmbed,
        onChange: (value: string) => {
          this.embedColor = value;
          this.update();
        },
      },
      {
        type: 'button',
        key: 'test',
        label: 'Send Test Message',
        onClick: async () => {
          await this.sendDiscordMessage({
            content: this.testMessage,
            username: this.username || undefined,
            avatar_url: this.avatarUrl || undefined,
            embeds: this.useEmbed ? [{
              title: 'Test Embed',
              description: 'This is a test message from the Rete.js Discord Webhook Node.',
              color: this.hexToDecimal(this.embedColor),
              timestamp: new Date().toISOString(),
            }] : undefined,
          });
        },
      },
    ];
  }

  private hexToDecimal(hex: string): number {
    return parseInt(hex.replace('#', ''), 16);
  }

  private async sendDiscordMessage(payload: DiscordWebhookPayload): Promise<{ success: boolean; response: any }> {
    if (!this.webhookUrl) {
      const errorMsg = 'Webhook URL is required';
      this.log(errorMsg, 'error');
      this.lastStatus = { success: false, message: errorMsg, timestamp: Date.now() };
      return { success: false, response: { error: errorMsg } };
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        const errorMsg = responseData.message || `HTTP ${response.status} ${response.statusText}`;
        this.log(`Failed to send message: ${errorMsg}`, 'error');
        this.lastStatus = { success: false, message: errorMsg, timestamp: Date.now() };
        return { success: false, response: responseData };
      }

      this.log('Message sent successfully', 'success');
      this.lastStatus = { 
        success: true, 
        message: 'Message sent successfully', 
        timestamp: Date.now() 
      };
      
      return { success: true, response: responseData };
    } catch (error) {
      const errorMsg = error.message || 'Failed to send message';
      this.log(`Error: ${errorMsg}`, 'error');
      this.lastStatus = { success: false, message: errorMsg, timestamp: Date.now() };
      return { success: false, response: { error: errorMsg } };
    }
  }

  protected async executeNode(
    inputs: Record<string, any>,
    context: any
  ): Promise<Record<string, any>> {
    const message = inputs.message;
    const title = inputs.title;
    const url = inputs.url;
    const trigger = inputs.trigger !== undefined;

    if (!trigger) {
      this.log('No trigger received, skipping execution');
      return {
        success: false,
        response: { error: 'No trigger received' },
      };
    }

    if (!message && !title) {
      const errorMsg = 'Either message or title is required';
      this.log(errorMsg, 'error');
      return {
        success: false,
        response: { error: errorMsg },
      };
    }

    const payload: DiscordWebhookPayload = {
      username: this.username || undefined,
      avatar_url: this.avatarUrl || undefined,
    };

    if (this.useEmbed) {
      payload.embeds = [{
        title: title || undefined,
        description: message || undefined,
        url: url || undefined,
        color: this.hexToDecimal(this.embedColor),
        timestamp: new Date().toISOString(),
      }];
    } else {
      payload.content = message || title;
    }

    const { success, response } = await this.sendDiscordMessage(payload);
    
    return {
      success,
      response,
    };
  }

  getLastStatus() {
    return this.lastStatus;
  }

  async onCreated() {
    super.onCreated();
    this.log('Discord Webhook Node created');
  }

  async onDestroy() {
    this.log('Discord Webhook Node destroyed');
    super.onDestroy();
  }
}
