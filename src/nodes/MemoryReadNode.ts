import { NodeEditor } from 'rete';
import { BaseNode } from '../core/BaseNode';
import { NodeInput, NodeOutput, NodeControl } from '../types/node.types';

export class MemoryReadNode extends BaseNode {
  private memoryKey: string = '';
  private defaultValue: string = '';
  private useDefault: boolean = false;

  constructor(editor: NodeEditor) {
    super(editor, 'memory-read', 'Read Memory');
  }

  getInputs(): NodeInput[] {
    return [
      { 
        name: 'key', 
        type: 'string', 
        description: 'Memory key to read from',
        required: false
      },
      { 
        name: 'default', 
        type: 'any', 
        description: 'Default value if key not found',
        required: false
      },
    ];
  }

  getOutputs(): NodeOutput[] {
    return [
      { 
        name: 'value', 
        type: 'any', 
        description: 'Value read from memory' 
      },
      { 
        name: 'exists', 
        type: 'boolean', 
        description: 'Whether the key existed in memory' 
      },
    ];
  }

  getControls(): NodeControl[] {
    return [
      {
        type: 'text',
        key: 'memoryKey',
        label: 'Memory Key',
        placeholder: 'Enter memory key',
        value: this.memoryKey,
        onChange: (value: string) => {
          this.memoryKey = value.trim();
          this.update();
        },
      },
      {
        type: 'toggle',
        key: 'useDefault',
        label: 'Use Default Value',
        value: this.useDefault,
        onChange: (value: boolean) => {
          this.useDefault = value;
          this.update();
        },
      },
      {
        type: 'text',
        key: 'defaultValue',
        label: 'Default Value',
        placeholder: 'Enter default value',
        value: this.defaultValue,
        disabled: !this.useDefault,
        onChange: (value: string) => {
          this.defaultValue = value;
          this.update();
        },
      },
    ];
  }

  protected async executeNode(
    inputs: Record<string, any>,
    context: any
  ): Promise<Record<string, any>> {
    const key = inputs.key || this.memoryKey;
    
    if (!key) {
      throw new Error('Memory key is required');
    }

    this.log(`Reading from memory: ${key}`);
    
    try {
      const value = await this.memory.get(key);
      const exists = value !== null;
      
      if (!exists && this.useDefault) {
        this.log(`Key not found, using default value`);
        return {
          value: inputs.default !== undefined ? inputs.default : this.defaultValue,
          exists: false,
        };
      }
      
      if (!exists) {
        this.log(`Key not found in memory`);
        return {
          value: null,
          exists: false,
        };
      }
      
      this.log(`Successfully read value from memory`);
      return {
        value,
        exists: true,
      };
    } catch (error) {
      this.log(`Error reading from memory: ${error.message}`);
      throw error;
    }
  }

  async onCreated() {
    super.onCreated();
    this.log('Memory Read Node created');
  }

  async onDestroy() {
    this.log('Memory Read Node destroyed');
    super.onDestroy();
  }
}
