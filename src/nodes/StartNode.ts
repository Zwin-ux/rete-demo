import { ClassicPreset, NodeEditor } from 'rete';
import { AreaPlugin } from 'rete-area-plugin';
import { BaseNode, NodeScheme } from '../core/BaseNode';
import { NodeContext } from '../types/node.types';
import { SocketType } from '../utils/connectionUtils';

const socket = new ClassicPreset.Socket('socket');

export class StartNode extends BaseNode<{}> {
  constructor(editor: NodeEditor<NodeScheme>, area: AreaPlugin<NodeScheme, any>) {
    super(editor, area, 'start', 'Start');
    
    // Add execution output
    this.addExecOutput('exec', 'Start');
    
    // Add data output for passing initial data
    this.addDataOutput('data', 'Data');
  }

  async executeNode(
    inputs: {},
    context: NodeContext
  ): Promise<{ exec: boolean }> {
    this.info('Workflow started');
    return { exec: true };
  }
}
