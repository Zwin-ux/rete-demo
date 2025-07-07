import { ClassicPreset, NodeEditor } from 'rete';
import { AreaPlugin } from 'rete-area-plugin';
import { BaseNode, NodeScheme } from '../core/BaseNode';
import { NodeContext } from '../types/node.types';

type NodeData = {
  memoryKey: string;
  autoExecute: boolean;
  ttl: number;
};

const socket = new ClassicPreset.Socket('socket');

export class MemoryWriteNode extends BaseNode<NodeData> {
  constructor(editor: NodeEditor<NodeScheme>, area: AreaPlugin<NodeScheme, any>) {
    super(editor, area, 'memory-write', 'Write Memory', {
      memoryKey: '',
      autoExecute: false,
      ttl: 0, // 0 = no expiration
    });

    this.addInput('key', new ClassicPreset.Input(socket, 'Key'));
    this.addInput('value', new ClassicPreset.Input(socket, 'Value'));
    this.addInput('trigger', new ClassicPreset.Input(socket, 'Trigger'));

    this.addOutput('success', new ClassicPreset.Output(socket, 'Success'));
    this.addOutput('trigger', new ClassicPreset.Output(socket, 'Trigger'));

    this.addControl('memoryKey', new ClassicPreset.InputControl('text', {
      initial: this.data.memoryKey, change: (value) => { this.data.memoryKey = value; this.update(); }
    }));
    this.addControl('autoExecute', new ClassicPreset.InputControl('text', { // TODO: change to checkbox
      initial: this.data.autoExecute ? 'true' : 'false',
      change: (value) => { this.data.autoExecute = value === 'true'; this.update(); }
    }));
    this.addControl('ttl', new ClassicPreset.InputControl('number', {
      initial: this.data.ttl, change: (value) => { this.data.ttl = value; this.update(); }
    }));
  }

  private async storeWithExpiration(key: string, value: any, ttl: number) {
    const item = {
      value,
      expires: ttl > 0 ? Date.now() + ttl * 1000 : null,
    };
    await this.memory.set(key, item);
  }

  async executeNode(
    inputs: { key?: string[], value?: any[], trigger?: any[] },
    context: NodeContext
  ): Promise<{ success: boolean, trigger?: boolean, error?: string }> {
    const key = inputs.key?.[0] || this.data.memoryKey;
    const value = inputs.value?.[0];
    const trigger = inputs.trigger !== undefined;
    
    if (!key) {
      this.warn('Memory key is required');
      return { success: false };
    }

    if (!this.data.autoExecute && !trigger) {
      this.info('Skipping write: no trigger and auto-write is disabled');
      return { success: false, trigger: false };
    }

    this.info(`Writing to memory: ${key}`);
    
    try {
      if (value === undefined) {
        throw new Error('No value provided to write');
      }
      
      await this.storeWithExpiration(key, value, this.data.ttl);
      
      this.info(`Successfully wrote value to memory${this.data.ttl > 0 ? ` (expires in ${this.data.ttl}s)` : ''}`);
      
      return { success: true, trigger: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.error(`Error writing to memory: ${errorMessage}`);
      return { success: false, trigger: false, error: errorMessage };
    }
  }
}
