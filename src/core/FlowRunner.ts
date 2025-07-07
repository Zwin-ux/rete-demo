import { ClassicPreset, NodeEditor } from 'rete';
import { NodeExecutionResult } from '../types/node.types';
import { NodeScheme } from './BaseNode';
import { NodeMemory } from './memory';

export class FlowRunner {
  private editor: NodeEditor<NodeScheme>;
  private executionStates: Map<string, NodeExecutionResult> = new Map();
  private executionOrder: string[] = [];
  private isRunning: boolean = false;
  private onNodeStateChange: (nodeId: string, state: NodeExecutionResult) => void;
  private onExecutionComplete: () => void;

  constructor(
    editor: NodeEditor<NodeScheme>,
    callbacks: {
      onNodeStateChange: (nodeId: string, state: NodeExecutionResult) => void;
      onExecutionComplete: () => void;
    }
  ) {
    this.editor = editor;
    this.onNodeStateChange = callbacks.onNodeStateChange;
    this.onExecutionComplete = callbacks.onExecutionComplete;
  }

  private resetExecutionStates() {
    this.executionStates.clear();
    this.executionOrder = [];
    
    // Initialize states for all nodes
    this.editor.getNodes().forEach(node => {
      this.executionStates.set(node.id, {
        success: false,
        status: 'pending',
        inputs: {},
        outputs: {},
        logs: [],
      });
    });
  }

  private updateNodeState(nodeId: string, updates: Partial<NodeExecutionResult>) {
    const state = this.executionStates.get(nodeId);
    if (!state) return;

    const newState = { ...state, ...updates };
    this.executionStates.set(nodeId, newState);
    this.onNodeStateChange(nodeId, newState);
  }

  private async getNodeInputs(node: ClassicPreset.Node): Promise<Record<string, any>> {
    const inputs: Record<string, any> = {};
    const connections = this.editor.getConnections()
      .filter(conn => conn.target === node.id);

    for (const conn of connections) {
      const sourceNode = this.editor.getNode(conn.source);
      const sourceState = this.executionStates.get(conn.source);
      
      if (!sourceNode || !sourceState || sourceState.status !== 'success') {
        continue;
      }

      const outputValue = sourceState.output?.[conn.sourceOutput];
      if (outputValue !== undefined) {
        inputs[conn.targetInput] = outputValue;
      }
    }

    return inputs;
  }

  private async executeNode(node: ClassicPreset.Node): Promise<NodeExecutionResult> {
    // Update state to running
    this.updateNodeState(node.id, {
      status: 'running',
      startTime: Date.now(),
    });

    try {
      // Get inputs from connected nodes
      const inputs = await this.getNodeInputs(node);
      
      // Execute the node
      const result = await (node as any).run(inputs);
      
      // Update state with success
      const endTime = Date.now();
      this.updateNodeState(node.id, {
        status: 'success',
        endTime,
        output: result.output,
        logs: result.logs,
        success: true,
        inputs,
      });
      
      return { ...result, status: 'success', inputs, endTime };
    } catch (error) {
      // Update state with error
      const endTime = Date.now();
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.updateNodeState(node.id, {
        status: 'error',
        endTime,
        error: errorMessage,
        success: false,
      });
      
      return { 
        success: false, 
        status: 'error', 
        error: errorMessage,
        endTime,
      };
    }
  }

  private calculateExecutionOrder(): string[] {
    const nodes = this.editor.getNodes();
    const visited = new Set<string>();
    const temp = new Set<string>();
    const order: string[] = [];

    const visit = (nodeId: string) => {
      if (temp.has(nodeId)) {
        throw new Error('Cycle detected in the graph');
      }
      
      if (visited.has(nodeId)) return;
      
      temp.add(nodeId);
      
      // Get all nodes that this node depends on (nodes connected to inputs)
      const dependencies = this.editor.getConnections()
        .filter(conn => conn.target === nodeId)
        .map(conn => conn.source);
      
      for (const depId of dependencies) {
        visit(depId);
      }
      
      temp.delete(nodeId);
      visited.add(nodeId);
      order.push(nodeId);
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        visit(node.id);
      }
    }

    return order;
  }

  public async run() {
    if (this.isRunning) {
      console.warn('Execution already in progress');
      return;
    }

    this.isRunning = true;
    this.resetExecutionStates();
    
    try {
      // Calculate execution order (topological sort)
      this.executionOrder = this.calculateExecutionOrder();
      
      // Execute nodes in order
      for (const nodeId of this.executionOrder) {
        const node = this.editor.getNode(nodeId);
        if (!node) continue;
        
        await this.executeNode(node);
        
        // Stop execution if a node fails
        const state = this.executionStates.get(nodeId);
        if (state?.status === 'error') {
          console.error(`Node ${nodeId} failed:`, state.error);
          break;
        }
      }
    } catch (error) {
      console.error('Error during execution:', error);
    } finally {
      this.isRunning = false;
      this.onExecutionComplete();
    }
  }

  public stop() {
    // Implementation for stopping execution
    this.isRunning = false;
  }

  public getNodeState(nodeId: string): NodeExecutionResult | undefined {
    return this.executionStates.get(nodeId);
  }

  public getExecutionOrder(): string[] {
    return [...this.executionOrder];
  }

  public isExecutionComplete(): boolean {
    return !this.isRunning && this.executionOrder.length > 0;
  }
}
