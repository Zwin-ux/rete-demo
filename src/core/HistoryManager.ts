/**
 * History Manager for undo/redo functionality
 * Tracks editor actions and allows undoing and redoing them
 */

import { NodeEditor } from 'rete';
import { NodeScheme } from './BaseNode';

// Define action types that can be tracked
export enum ActionType {
  NODE_ADDED = 'node-added',
  NODE_REMOVED = 'node-removed',
  NODE_MOVED = 'node-moved',
  CONNECTION_CREATED = 'connection-created',
  CONNECTION_REMOVED = 'connection-removed',
  NODE_DATA_CHANGED = 'node-data-changed',
}

// Interface for action data
export interface Action {
  type: ActionType;
  data: any;
  timestamp: number;
  description: string;
}

export class HistoryManager {
  private history: Action[] = [];
  private redoStack: Action[] = [];
  private maxHistorySize: number = 50;
  private editor: NodeEditor<NodeScheme>;
  private isUndoRedoInProgress = false;
  
  constructor(editor: NodeEditor<NodeScheme>) {
    this.editor = editor;
    this.setupListeners();
  }
  
  /**
   * Set up event listeners to track editor actions
   */
  private setupListeners() {
    // Track node addition
    this.editor.addPipe(context => {
      if (context.type === 'nodecreated' && !this.isUndoRedoInProgress) {
        const node = context.data;
        this.addAction({
          type: ActionType.NODE_ADDED,
          data: {
            nodeId: node.id,
            nodeType: node.label,
            position: { x: (node as any).position?.x || 0, y: (node as any).position?.y || 0 },
            data: { ...(node as any).data }
          },
          description: `Added ${node.label} node`
        });
      }
      return context;
    });
    
    // Track node removal
    this.editor.addPipe(context => {
      if (context.type === 'noderemoved' && !this.isUndoRedoInProgress) {
        const node = context.data;
        this.addAction({
          type: ActionType.NODE_REMOVED,
          data: {
            nodeId: node.id,
            nodeType: node.label,
            position: { x: (node as any).position?.x || 0, y: (node as any).position?.y || 0 },
            data: { ...(node as any).data },
            connections: this.getNodeConnections(node.id)
          },
          description: `Removed ${node.label} node`
        });
      }
      return context;
    });
    
    // Track connection creation
    this.editor.addPipe(context => {
      if (context.type === 'connectioncreated' && !this.isUndoRedoInProgress) {
        const connection = context.data;
        this.addAction({
          type: ActionType.CONNECTION_CREATED,
          data: {
            connectionId: connection.id,
            source: connection.source,
            target: connection.target,
            sourceOutput: connection.sourceOutput,
            targetInput: connection.targetInput
          },
          description: `Created connection`
        });
      }
      return context;
    });
    
    // Track connection removal
    this.editor.addPipe(context => {
      if (context.type === 'connectionremoved' && !this.isUndoRedoInProgress) {
        const connection = context.data;
        this.addAction({
          type: ActionType.CONNECTION_REMOVED,
          data: {
            connectionId: connection.id,
            source: connection.source,
            target: connection.target,
            sourceOutput: connection.sourceOutput,
            targetInput: connection.targetInput
          },
          description: `Removed connection`
        });
      }
      return context;
    });
    
    // Track node movement
    // This requires additional implementation in the editor to track node position changes
  }
  
  /**
   * Get all connections attached to a node
   */
  private getNodeConnections(nodeId: string) {
    const connections: any[] = [];
    this.editor.getConnections().forEach(connection => {
      if (connection.source === nodeId || connection.target === nodeId) {
        connections.push({
          connectionId: connection.id,
          source: connection.source,
          target: connection.target,
          sourceOutput: connection.sourceOutput,
          targetInput: connection.targetInput
        });
      }
    });
    return connections;
  }
  
  /**
   * Add an action to the history
   */
  public addAction(action: Omit<Action, 'timestamp'>) {
    if (this.isUndoRedoInProgress) return;
    
    // Clear redo stack when a new action is performed
    this.redoStack = [];
    
    const fullAction: Action = {
      ...action,
      timestamp: Date.now()
    };
    
    this.history.push(fullAction);
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
    
    // Dispatch event for UI updates
    document.dispatchEvent(new CustomEvent('history-changed', {
      detail: {
        canUndo: this.canUndo(),
        canRedo: this.canRedo()
      }
    }));
  }
  
  /**
   * Check if undo is available
   */
  public canUndo(): boolean {
    return this.history.length > 0;
  }
  
  /**
   * Check if redo is available
   */
  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }
  
  /**
   * Undo the last action
   */
  public async undo() {
    if (!this.canUndo()) return;
    
    this.isUndoRedoInProgress = true;
    
    const action = this.history.pop();
    if (!action) {
      this.isUndoRedoInProgress = false;
      return;
    }
    
    this.redoStack.push(action);
    
    try {
      await this.executeUndo(action);
    } catch (error) {
      console.error('Error during undo:', error);
    }
    
    this.isUndoRedoInProgress = false;
    
    // Dispatch event for UI updates
    document.dispatchEvent(new CustomEvent('history-changed', {
      detail: {
        canUndo: this.canUndo(),
        canRedo: this.canRedo()
      }
    }));
  }
  
  /**
   * Redo the last undone action
   */
  public async redo() {
    if (!this.canRedo()) return;
    
    this.isUndoRedoInProgress = true;
    
    const action = this.redoStack.pop();
    if (!action) {
      this.isUndoRedoInProgress = false;
      return;
    }
    
    this.history.push(action);
    
    try {
      await this.executeRedo(action);
    } catch (error) {
      console.error('Error during redo:', error);
    }
    
    this.isUndoRedoInProgress = false;
    
    // Dispatch event for UI updates
    document.dispatchEvent(new CustomEvent('history-changed', {
      detail: {
        canUndo: this.canUndo(),
        canRedo: this.canRedo()
      }
    }));
  }
  
  /**
   * Execute the undo operation for an action
   */
  private async executeUndo(action: Action) {
    switch (action.type) {
      case ActionType.NODE_ADDED:
        // Undo node addition by removing the node
        this.editor.removeNode(action.data.nodeId);
        break;
        
      case ActionType.NODE_REMOVED:
        // Undo node removal by recreating the node
        // This requires additional implementation to recreate the node with its data
        // For now, we'll just log that this needs implementation
        console.log('Undo node removal not yet implemented');
        break;
        
      case ActionType.CONNECTION_CREATED:
        // Undo connection creation by removing the connection
        this.editor.removeConnection(action.data.connectionId);
        break;
        
      case ActionType.CONNECTION_REMOVED:
        // Undo connection removal by recreating the connection
        // This requires additional implementation
        console.log('Undo connection removal not yet implemented');
        break;
        
      case ActionType.NODE_MOVED:
        // Undo node movement by restoring previous position
        // This requires additional implementation
        console.log('Undo node movement not yet implemented');
        break;
        
      case ActionType.NODE_DATA_CHANGED:
        // Undo data change by restoring previous data
        // This requires additional implementation
        console.log('Undo node data change not yet implemented');
        break;
    }
  }
  
  /**
   * Execute the redo operation for an action
   */
  private async executeRedo(action: Action) {
    switch (action.type) {
      case ActionType.NODE_ADDED:
        // Redo node addition by recreating the node
        // This requires additional implementation
        console.log('Redo node addition not yet implemented');
        break;
        
      case ActionType.NODE_REMOVED:
        // Redo node removal by removing the node again
        this.editor.removeNode(action.data.nodeId);
        break;
        
      case ActionType.CONNECTION_CREATED:
        // Redo connection creation by recreating the connection
        // This requires additional implementation
        console.log('Redo connection creation not yet implemented');
        break;
        
      case ActionType.CONNECTION_REMOVED:
        // Redo connection removal by removing the connection again
        this.editor.removeConnection(action.data.connectionId);
        break;
        
      case ActionType.NODE_MOVED:
        // Redo node movement by applying the new position
        // This requires additional implementation
        console.log('Redo node movement not yet implemented');
        break;
        
      case ActionType.NODE_DATA_CHANGED:
        // Redo data change by applying the new data
        // This requires additional implementation
        console.log('Redo node data change not yet implemented');
        break;
    }
  }
  
  /**
   * Clear the history
   */
  public clear() {
    this.history = [];
    this.redoStack = [];
    
    // Dispatch event for UI updates
    document.dispatchEvent(new CustomEvent('history-changed', {
      detail: {
        canUndo: false,
        canRedo: false
      }
    }));
  }
  
  /**
   * Get the current history state
   */
  public getState() {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      historyLength: this.history.length,
      redoStackLength: this.redoStack.length
    };
  }
}
