import { NodeEditor } from 'rete';
import { BaseNode } from '../core/BaseNode';
import { NodeInput, NodeOutput, NodeControl } from '../types/node.types';

export class MemoryWriteNode extends BaseNode {
  private memoryKey: string = '';
  private autoExecute: boolean = false;
  private ttl: number = 0; // Time to live in seconds (0 = no expiration)

  constructor(editor: NodeEditor) {
    super(editor, 'memory-write', 'Write Memory');
  }

  getInputs(): NodeInput[] {
    return [
      { 
        name: 'key', 
        type: 'string', 
        description: 'Memory key to write to',
        required: true
      },
      { 
        name: 'value', 
        type: 'any', 
        description: 'Value to store in memory',
        required: true
      },
      { 
        name: 'trigger', 
        type: 'event', 
        description: 'Trigger to write the value',
        required: false
      },
    ];
  }

  getOutputs(): NodeOutput[] {
    return [
      { 
        name: 'success', 
        type: 'boolean', 
        description: 'Whether the write was successful' 
      },
      { 
        name: 'trigger', 
        type: 'event', 
        description: 'Triggered after successful write' 
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
        key: 'autoExecute',
        label: 'Auto-write on input change',
        value: this.autoExecute,
        onChange: (value: boolean) => {
          this.autoExecute = value;
          this.update();
        },
      },
      {
        type: 'number',
        key: 'ttl',
        label: 'Expiration (seconds)',
        description: 'Time until the value expires (0 = never)',
        min: 0,
        step: 1,
        value: this.ttl,
        onChange: (value: unknown) => {
          this.ttl = Math.max(0, value as number);
          this.update();
        },
      },
    ];
  }

  private async storeWithExpiration(key: string, value: any, ttl: number) {
    const item = {
      value,
      expires: ttl > 0 ? Date.now() + ttl * 1000 : null,
    };
    
    await this.memory.set(key, item);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    context: any
  ): Promise<Record<string, any>> {
    const key = inputs.key || this.memoryKey;
    const value = inputs.value;
    const trigger = inputs.trigger !== undefined;
    
    if (!key) {
      throw new Error('Memory key is required');
    }

    // If auto-execute is off and there's no trigger, don't write
    if (!this.autoExecute && !trigger) {
      this.log('Skipping write - no trigger and auto-write is disabled');
      return {
        success: false,
        trigger: false,
      };
    }

    this.log(`Writing to memory: ${key}`);
    
    try {
      if (value === undefined) {
        throw new Error('No value provided to write');
      }
      
      await this.storeWithExpiration(key, value, this.ttl);
      
      this.log(`Successfully wrote value to memory${this.ttl > 0 ? ` (expires in ${this.ttl} seconds)` : ''}`);
      
      return {
        success: true,
        trigger: true,
      };
    } catch (error) {
      this.log(`Error writing to memory: ${error.message}`);
      return {
        success: false,
        trigger: false,
        error: error.message,
      };
    }
  }

  async onCreated() {
    super.onCreated();
    this.log('Memory Write Node created');
  }

  async onDestroy() {
    this.log('Memory Write Node destroyed');
    super.onDestroy();
  }
}
