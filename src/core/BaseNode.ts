import { Node } from 'rete';
import type { NodeEditor, NodeData as ReteNodeData } from 'rete';
import { NodeContext, NodeExecutionResult } from '../types/node.types';
import { NodeMemory } from './memory';

// Define a type for the node editor's scheme
type NodeScheme = {
  Node: {
    id: string;
    data: Record<string, unknown>;
    position: [number, number];
  };
  Connection: {
    id: string;
    source: string;
    target: string;
    sourceOutput: string;
    targetInput: string;
  };
};

declare module 'rete/types/events' {
  interface EventsTypes {
    [key: string]: any;
  }
}

// Extend the Rete NodeData interface to include our custom properties
declare module 'rete/types/core/data' {
  interface NodeData {
    id: string;
    name: string;
    type: string;
    [key: string]: any;
  }
}

// Extend the base node data with our required properties
export interface BaseNodeData extends Record<string, unknown> {
  id: string;
  name: string;
  type: string;
}

export abstract class BaseNode<T extends BaseNodeData = BaseNodeData> extends Node {
  protected logs: string[] = [];
  protected memory: NodeMemory;
  protected editor: NodeEditor<NodeScheme>;
  
  // Override the data property to use our extended type
  public data: T;

  constructor(editor: NodeEditor<NodeScheme>, key: string, name: string) {
    super(key);
    this.editor = editor;
    this.memory = new NodeMemory(this.id);
    
    // Initialize with default data
    this.data = {
      id: this.id,
      name,
      type: key,
      // Add any other default properties here
    } as T;
  }
  
  /**
   * Logs a message with a timestamp
   * @param message The message to log
   */
  protected log(message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    this.logs.push(logMessage);
    // Use optional chaining to safely access data.name
    console.log(`[${this.data?.name || 'Node'}] ${message}`);
    console.log(`[${this.data?.name || 'Node'}] ${message}`);
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
