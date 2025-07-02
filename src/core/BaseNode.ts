import { Node, NodeEditor } from 'rete';
import { NodeData, NodeContext, NodeExecutionResult } from '../types/node.types';
import { NodeMemory } from './memory';

export abstract class BaseNode extends Node {
  protected logs: string[] = [];
  protected memory: NodeMemory;
  protected editor: NodeEditor;

  constructor(editor: NodeEditor, key: string, name: string) {
    super(key);
    this.editor = editor;
    this.data.name = name;
    this.memory = new NodeMemory(this.id);
  }

  protected log(message: string): void {
    const timestamp = new Date().toISOString();
    this.logs.push(`[${timestamp}] ${message}`);
    console.log(`[${this.data.name}] ${message}`);
  }

  protected clearLogs(): void {
    this.logs = [];
  }

  protected getContext(): NodeContext {
    return {
      memory: {
        get: (key: string) => this.memory.get(key),
        set: (key: string, value: any) => this.memory.set(key, value),
        delete: (key: string) => this.memory.delete(key),
      },
      log: (message: string) => this.log(message),
      nodeId: this.id,
    };
  }

  protected abstract executeNode(
    inputs: Record<string, any>,
    context: NodeContext
  ): Promise<Record<string, any>>;

  async run(inputs: Record<string, any> = {}): Promise<NodeExecutionResult> {
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
      this.log(`Error: ${errorMessage}`);
      
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

  getNodeData(): NodeData {
    return {
      id: this.id,
      type: this.data.type || 'base',
      ...this.data,
    };
  }
}
