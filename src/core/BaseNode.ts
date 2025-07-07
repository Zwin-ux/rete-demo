import { ClassicPreset, NodeEditor } from 'rete';
import type { NodeEditor as ReteNodeEditor } from 'rete';
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

export abstract class BaseNode<T extends BaseNodeData = BaseNodeData> extends ClassicPreset.Node {
  protected logs: string[] = [];
  protected memory: NodeMemory;
  protected editor: ReteNodeEditor<NodeScheme>;
  
  public data: T;

  constructor(editor: ReteNodeEditor<NodeScheme>, key: string, name: string) {
    super(key);
    this.editor = editor;
    this.memory = new NodeMemory(this.id);
    
    this.data = {
      id: this.id,
      name,
      type: key,
    } as T;
  }
  
  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    this.logs.push(logMessage);
    
    if (level === 'error') {
      console.error(`[${this.data?.name || 'Node'}] ${message}`);
    } else if (level === 'warn') {
      console.warn(`[${this.data?.name || 'Node'}] ${message}`);
    } else {
      console.log(`[${this.data?.name || 'Node'}] ${message}`);
    }
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
    this.editor.update(this.id);
  }

  // Lifecycle methods (can be overridden by child classes)
  async onCreated(): Promise<void> {
    // Override in child classes for custom creation logic
  }

  async onDestroy(): Promise<void> {
    // Override in child classes for custom destruction logic
  }
}
