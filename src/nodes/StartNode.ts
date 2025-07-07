import { ClassicPreset, NodeEditor } from 'rete';
import { AreaPlugin } from 'rete-area-plugin';
import { BaseNode, NodeScheme } from '../core/BaseNode';
import { NodeContext } from '../types/node.types';

const socket = new ClassicPreset.Socket('socket');

export class StartNode extends BaseNode<{}> {
  constructor(editor: NodeEditor<NodeScheme>, area: AreaPlugin<NodeScheme, any>) {
    super(editor, area, 'start', 'Start');
    this.addOutput('exec', new ClassicPreset.Output(socket, 'Exec'));
  }

  async executeNode(
    inputs: {},
    context: NodeContext
  ): Promise<{ exec: boolean }> {
    this.info('Workflow started');
    return { exec: true };
  }
}
