import { ClassicPreset, NodeEditor } from 'rete';
import { AreaPlugin } from 'rete-area-plugin';
import { BaseNode, NodeScheme } from '../core/BaseNode';
import { NodeContext } from '../types/node.types';

const socket = new ClassicPreset.Socket('socket');

export class ConsoleLogNode extends BaseNode<{ message: string }> {
  constructor(editor: NodeEditor<NodeScheme>, area: AreaPlugin<NodeScheme, any>) {
    super(editor, area, 'console-log', 'Console Log', { message: 'Hello World!' });
    this.addInput('message', new ClassicPreset.Input(socket, 'Message', true));

    this.addControl('message', new ClassicPreset.InputControl('text', {
      initial: this.data.message,
      change: (value) => {
        this.data.message = value;
        this.update();
      }
    }));
  }

  private formatLogMessage(input: any): string {
    if (input === undefined) return 'undefined';
    if (input === null) return 'null';
    
    if (typeof input === 'string') {
      return input;
    }
    
    if (typeof input === 'object') {
      try {
        return JSON.stringify(input, null, 2);
      } catch (e) {
        return String(input);
      }
    }
    
    return String(input);
  }

  async executeNode(
    inputs: { message?: any[] },
    context: NodeContext
  ): Promise<{}> {
    const message = inputs.message ? inputs.message[0] : this.data.message;
    const formattedMessage = this.formatLogMessage(message);
    
    this.info(formattedMessage);
    
    return {};
  }
}
