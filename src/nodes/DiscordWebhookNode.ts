import { ClassicPreset, NodeEditor } from 'rete';
import { AreaPlugin } from 'rete-area-plugin';
import { BaseNode, NodeScheme } from '../core/BaseNode';
import { NodeContext } from '../types/node.types';

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

type NodeData = {
  webhookUrl: string;
  username: string;
  avatarUrl: string;
  useEmbed: boolean;
  embedColor: string;
  message: string;
  title: string;
  url: string;
}

const socket = new ClassicPreset.Socket('socket');

export class DiscordWebhookNode extends BaseNode<NodeData> {
  private lastStatus: { success: boolean; message: string; timestamp: number } | null = null;

  constructor(editor: NodeEditor<NodeScheme>, area: AreaPlugin<NodeScheme, any>) {
    super(editor, area, 'discord-webhook', 'Discord Webhook', {
      webhookUrl: '',
      username: 'Rete Bot',
      avatarUrl: '',
      useEmbed: true,
      embedColor: '#5865F2',
      message: '',
      title: '',
      url: ''
    });

    this.addInput('message', new ClassicPreset.Input(socket, 'Message'));
    this.addInput('title', new ClassicPreset.Input(socket, 'Title'));
    this.addInput('url', new ClassicPreset.Input(socket, 'URL'));

    this.addOutput('success', new ClassicPreset.Output(socket, 'Success'));
    this.addOutput('response', new ClassicPreset.Output(socket, 'Response'));

    this.addControl('webhookUrl', new ClassicPreset.InputControl('text', { 
      initial: this.data.webhookUrl, change: (value) => { this.data.webhookUrl = value; this.update(); },
      placeholder: 'Enter Discord Webhook URL'
    }));
    this.addControl('username', new ClassicPreset.InputControl('text', { 
      initial: this.data.username, change: (value) => { this.data.username = value; this.update(); }
    }));
    this.addControl('avatarUrl', new ClassicPreset.InputControl('text', { 
      initial: this.data.avatarUrl, change: (value) => { this.data.avatarUrl = value; this.update(); }
    }));
    this.addControl('useEmbed', new ClassicPreset.InputControl('text', { // TODO: change to checkbox
      initial: this.data.useEmbed ? 'true' : 'false',
      change: (value) => { this.data.useEmbed = value === 'true'; this.update(); }
    }));
    this.addControl('embedColor', new ClassicPreset.InputControl('text', { // type 'color' not standard
      initial: this.data.embedColor, change: (value) => { this.data.embedColor = value; this.update(); }
    }));
  }

  private hexToDecimal(hex: string): number {
    return parseInt(hex.replace('#', ''), 16);
  }

  private async sendDiscordMessage(payload: DiscordWebhookPayload): Promise<{ success: boolean; response: any }> {
    if (!this.data.webhookUrl) {
      const errorMsg = 'Webhook URL is required';
      this.error(errorMsg);
      this.lastStatus = { success: false, message: errorMsg, timestamp: Date.now() };
      return { success: false, response: { error: errorMsg } };
    }

    try {
      const response = await fetch(this.data.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        const errorMsg = responseData.message || `HTTP ${response.status} ${response.statusText}`;
        this.error(`Failed to send message: ${errorMsg}`);
        this.lastStatus = { success: false, message: errorMsg, timestamp: Date.now() };
        return { success: false, response: responseData };
      }

      this.info('Message sent successfully');
      this.lastStatus = { 
        success: true, 
        message: 'Message sent successfully', 
        timestamp: Date.now() 
      };
      
      return { success: true, response: responseData };
    } catch (err: unknown) {
      const error = err as Error;
      const errorMsg = error.message || 'Failed to send message';
      this.error(`Error: ${errorMsg}`);
      this.lastStatus = { success: false, message: errorMsg, timestamp: Date.now() };
      return { success: false, response: { error: errorMsg } };
    }
  }

  async executeNode(
    inputs: { message?: string[], title?: string[], url?: string[] },
    context: NodeContext
  ): Promise<{ success: boolean, response: any }> {
    const message = inputs.message?.[0] || this.data.message;
    const title = inputs.title?.[0] || this.data.title;
    const url = inputs.url?.[0] || this.data.url;

    const payload: DiscordWebhookPayload = {
      username: this.data.username || undefined,
      avatar_url: this.data.avatarUrl || undefined,
    };

    if (this.data.useEmbed) {
      payload.embeds = [{
        title: title || undefined,
        description: message || undefined,
        url: url || undefined,
        color: this.hexToDecimal(this.data.embedColor),
        timestamp: new Date().toISOString(),
      }];
    } else {
      payload.content = message || title;
    }

    return this.sendDiscordMessage(payload);
  }

  getLastStatus() {
    return this.lastStatus;
  }
}
