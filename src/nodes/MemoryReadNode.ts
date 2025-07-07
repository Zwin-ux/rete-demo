import { ClassicPreset, NodeEditor } from 'rete';
import { AreaPlugin } from 'rete-area-plugin';
import { BaseNode, NodeScheme } from '../core/BaseNode';
import { NodeContext } from '../types/node.types';

type NodeData = {
  memoryKey: string;
  defaultValue: any;
  useDefault: boolean;
};

const socket = new ClassicPreset.Socket('socket');

export class MemoryReadNode extends BaseNode<NodeData> {
  constructor(editor: NodeEditor<NodeScheme>, area: AreaPlugin<NodeScheme, any>) {
    super(editor, area, 'memory-read', 'Read Memory', {
      memoryKey: '',
      defaultValue: '',
      useDefault: false,
    });

    this.addInput('key', new ClassicPreset.Input(socket, 'Key'));
    this.addInput('default', new ClassicPreset.Input(socket, 'Default'));

    this.addOutput('value', new ClassicPreset.Output(socket, 'Value'));
    this.addOutput('exists', new ClassicPreset.Output(socket, 'Exists'));

    this.addControl('memoryKey', new ClassicPreset.InputControl('text', {
      initial: this.data.memoryKey, change: (value) => { this.data.memoryKey = value; this.update(); }
    }));
    this.addControl('defaultValue', new ClassicPreset.InputControl('text', {
      initial: this.data.defaultValue, change: (value) => { this.data.defaultValue = value; this.update(); }
    }));
    this.addControl('useDefault', new ClassicPreset.InputControl('text', { // TODO: change to checkbox
      initial: this.data.useDefault ? 'true' : 'false', 
      change: (value) => { this.data.useDefault = value === 'true'; this.update(); }
    }));
  }

  async executeNode(
    inputs: { key?: string[], default?: any[] },
    context: NodeContext
  ): Promise<{ value: any, exists: boolean }> {
    const key = inputs.key?.[0] || this.data.memoryKey;
    
    if (!key) {
      this.warn('Memory key is required');
      return { value: null, exists: false };
    }

    this.info(`Reading from memory: ${key}`);
    
    try {
      const value = await this.memory.get(key);
      const exists = value !== null && value !== undefined;
      
      if (!exists && this.data.useDefault) {
        this.info(`Key not found, using default value`);
        const defaultValue = inputs.default?.[0] !== undefined ? inputs.default[0] : this.data.defaultValue;
        return { value: defaultValue, exists: false };
      }
      
      if (!exists) {
        this.info(`Key not found in memory`);
        return { value: null, exists: false };
      }
      
      this.info(`Successfully read value from memory`);
      return { value, exists: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.error(`Error reading from memory: ${errorMessage}`);
      throw error;
    }
  }
}
