// Helper utilities for node connections in the workflow editor
import { ClassicPreset } from 'rete';
import { SocketType } from '../utils/connectionUtils';
import { sockets } from '../editor';

/**
 * Helper class for managing node connections
 */
export class NodeConnectionHelper {
  /**
   * Create an input socket with the specified name and socket type
   * @param node The node to add the input to
   * @param name Input name
   * @param label Display label
   * @param socketType Socket type (exec, data, or any)
   * @param multipleConnections Whether this input can accept multiple connections
   */
  static addInput(
    node: ClassicPreset.Node,
    name: string,
    label: string,
    socketType: SocketType = SocketType.DATA,
    multipleConnections: boolean = false
  ) {
    const socket = sockets[socketType];
    const input = new ClassicPreset.Input(socket, label);
    
    // Set multiple connections flag
    input.multipleConnections = multipleConnections;
    
    // Add input to node
    node.addInput(name, input);
    return input;
  }

  /**
   * Create an output socket with the specified name and socket type
   * @param node The node to add the output to
   * @param name Output name
   * @param label Display label
   * @param socketType Socket type (exec, data, or any)
   */
  static addOutput(
    node: ClassicPreset.Node,
    name: string,
    label: string,
    socketType: SocketType = SocketType.DATA
  ) {
    const socket = sockets[socketType];
    const output = new ClassicPreset.Output(socket, label);
    
    // Add output to node
    node.addOutput(name, output);
    return output;
  }

  /**
   * Add standard execution inputs/outputs to a node
   * @param node The node to add execution sockets to
   * @param hasMultipleOutputs Whether to add multiple execution outputs (e.g. for conditional nodes)
   * @param outputNames Names for multiple outputs (e.g. ["true", "false"] for conditional)
   */
  static addExecutionSockets(
    node: ClassicPreset.Node,
    hasMultipleOutputs: boolean = false,
    outputNames: string[] = ["then"]
  ) {
    // Add standard execution input
    this.addInput(node, "exec", "►", SocketType.EXEC);
    
    // Add execution outputs
    if (hasMultipleOutputs) {
      outputNames.forEach(name => {
        this.addOutput(node, `exec_${name}`, name, SocketType.EXEC);
      });
    } else {
      this.addOutput(node, "exec", "►", SocketType.EXEC);
    }
    
    return node;
  }

  /**
   * Add data input to a node
   * @param node The node to add the input to
   * @param name Input name
   * @param label Display label
   * @param multipleConnections Whether this input can accept multiple connections
   */
  static addDataInput(
    node: ClassicPreset.Node,
    name: string,
    label: string,
    multipleConnections: boolean = false
  ) {
    return this.addInput(node, name, label, SocketType.DATA, multipleConnections);
  }

  /**
   * Add data output to a node
   * @param node The node to add the output to
   * @param name Output name
   * @param label Display label
   */
  static addDataOutput(
    node: ClassicPreset.Node,
    name: string,
    label: string
  ) {
    return this.addOutput(node, name, label, SocketType.DATA);
  }
}

export default NodeConnectionHelper;
