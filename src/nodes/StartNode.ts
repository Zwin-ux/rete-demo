import { NodeEditor } from 'rete';
import { BaseNode } from '../core/BaseNode';
import { NodeOutput } from '../types/node.types';

export class StartNode extends BaseNode {
  constructor(editor: NodeEditor) {
    super(editor, 'start', 'Start');
  }

  getInputs() {
    return [];
  }

  getOutputs(): NodeOutput[] {
    return [
      { 
        name: 'trigger', 
        type: 'event', 
        description: 'Trigger signal to start the workflow' 
      },
    ];
  }

  getControls() {
    return [];
  }

  protected async executeNode(): Promise<Record<string, any>> {
    this.log('Workflow started');
    return { trigger: true };
  }

  async onCreated() {
    super.onCreated();
    this.log('Start Node created');  
  }

  async onDestroy() {
    this.log('Start Node destroyed');
    super.onDestroy();
  }
}
