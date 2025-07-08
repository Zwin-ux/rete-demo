import { ClassicPreset, NodeEditor } from 'rete';
import { AreaPlugin } from 'rete-area-plugin';
import { NodeConnectionHelper } from './NodeConnectionHelper';
import { SocketType } from '../utils/connectionUtils';
import { NodeContext, NodeExecutionResult, NodeData as CustomNodeData } from '../types/node.types';
import { NodeMemory } from './memory';

// Define a type for the node editor's scheme
export type NodeScheme = {
  Node: ClassicPreset.Node;
  Connection: ClassicPreset.Connection<ClassicPreset.Node, ClassicPreset.Node>;
};

export interface BaseNodeData extends CustomNodeData {
  // Add any base properties common to all nodes here
}

export abstract class BaseNode<
  T extends {} = {}
> extends ClassicPreset.Node<{
    [key in string]?: ClassicPreset.Socket;
  }> {
  width = 180;
  height = 120;

  protected logs: { message: string; type: 'info' | 'warn' | 'error', timestamp: string }[] = [];
  protected maxLogs: number = 50;
  protected memory: NodeMemory;
  protected editor: NodeEditor<NodeScheme>;
  protected area: AreaPlugin<NodeScheme, any>;
  
  public data: T;

  constructor(editor: NodeEditor<NodeScheme>, area: AreaPlugin<NodeScheme, any>, key: string, name: string, initialData: T = {} as T) {
    super(key);
    this.label = name;
    this.editor = editor;
    this.area = area;
    this.memory = new NodeMemory(this.id);
    
    this.data = initialData;
  }
  
  protected log(message: string, type: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    this.logs.unshift({ timestamp, message, type });
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    this.update();
    if (type === 'error') {
      console.error(`[${this.label}] ${message}`);
    } else if (type === 'warn') {
      console.warn(`[${this.label}] ${message}`);
    } else {
      console.log(`[${this.label}] ${message}`);
    }
  }

  info(message: string) {
    this.log(message, 'info');
  }

  warn(message: string) {
    this.log(message, 'warn');
  }

  error(message: string) {
    this.log(message, 'error');
  }

  protected clearLogs(): void {
    this.logs = [];
  }

  protected getContext(): NodeContext {
    return {
      memory: {
        get: async (key: string) => this.memory.get(key),
        set: async (key: string, value: any) => this.memory.set(key, value),
        delete: async (key: string) => this.memory.delete(key),
        clear: async () => this.memory.clear(),
      },
      log: (message: string, level?: 'info' | 'warn' | 'error') => this.log(message, level),
      nodeId: this.id,
    };
  }

  /**
   * Execute the node's logic
   * @param inputs Node inputs
   * @param context Node execution context
   */
  protected abstract executeNode(
    inputs: Record<string, any>,
    context: NodeContext
  ): Promise<Record<string, any>>;

  /**
   * Add an execution input to this node
   * @param name Input name
   * @param label Display label
   */
  protected addExecInput(name: string = 'exec', label: string = '►') {
    return NodeConnectionHelper.addInput(this, name, label, SocketType.EXEC);
  }
  
  /**
   * Add an execution output to this node
   * @param name Output name
   * @param label Display label
   */
  protected addExecOutput(name: string = 'exec', label: string = '►') {
    return NodeConnectionHelper.addOutput(this, name, label, SocketType.EXEC);
  }
  
  /**
   * Add a data input to this node
   * @param name Input name
   * @param label Display label
   * @param multipleConnections Whether this input can accept multiple connections
   */
  protected addDataInput(name: string, label: string, multipleConnections: boolean = false) {
    return NodeConnectionHelper.addDataInput(this, name, label, multipleConnections);
  }
  
  /**
   * Add a data output to this node
   * @param name Output name
   * @param label Display label
   */
  protected addDataOutput(name: string, label: string) {
    return NodeConnectionHelper.addDataOutput(this, name, label);
  }
  
  /**
   * Set up standard execution sockets (input and output)
   * @param hasMultipleOutputs Whether to add multiple execution outputs
   * @param outputNames Names for multiple outputs
   */
  protected setupExecutionSockets(hasMultipleOutputs: boolean = false, outputNames: string[] = ["then"]) {
    NodeConnectionHelper.addExecutionSockets(this, hasMultipleOutputs, outputNames);
    return this;
  }

  async run(inputs: Record<string, any> = {}): Promise<Record<string, any>> {
    this.clearLogs();
    this.log('Node execution started');

    try {
      const context = this.getContext();
      const output = await this.executeNode(inputs, context);
      
      this.log('Node execution completed successfully');
      return {
        success: true,
        output,
        logs: this.logs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`Error: ${errorMessage}`, 'error');
      
      return {
        success: false,
        error: errorMessage,
        logs: this.logs,
      };
    }
  }

  async clearMemory(): Promise<void> {
    await this.memory.clear();
    this.log('Node memory cleared');
  }

  // Method to trigger a UI update for the node
  public update(): void {
    this.area.update('node', this.id);
  }

  // Lifecycle methods (can be overridden by child classes)
  async onCreated(): Promise<void> {
    // Override in child classes for custom creation logic
  }

  async onDestroy(): Promise<void> {
    // Override in child classes for custom destruction logic
  }
}
