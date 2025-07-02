import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Node } from 'rete';
import { NodeExecutionState } from '../types/node.types';

interface NodeDebugContextType {
  selectedNode: Node | null;
  nodeStates: Map<string, NodeExecutionState>;
  selectNode: (node: Node | null) => void;
  updateNodeState: (nodeId: string, state: NodeExecutionState) => void;
  clearNodeStates: () => void;
}

const NodeDebugContext = createContext<NodeDebugContextType | undefined>(undefined);

export const NodeDebugProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodeStates, setNodeStates] = useState<Map<string, NodeExecutionState>>(new Map());

  const updateNodeState = useCallback((nodeId: string, state: NodeExecutionState) => {
    setNodeStates(prev => {
      const newStates = new Map(prev);
      newStates.set(nodeId, state);
      return newStates;
    });
  }, []);

  const clearNodeStates = useCallback(() => {
    setNodeStates(new Map());
  }, []);

  const selectNode = useCallback((node: Node | null) => {
    setSelectedNode(node);
  }, []);

  return (
    <NodeDebugContext.Provider
      value={{
        selectedNode,
        nodeStates,
        selectNode,
        updateNodeState,
        clearNodeStates,
      }}
    >
      {children}
    </NodeDebugContext.Provider>
  );
};

export const useNodeDebug = (): NodeDebugContextType => {
  const context = useContext(NodeDebugContext);
  if (context === undefined) {
    throw new Error('useNodeDebug must be used within a NodeDebugProvider');
  }
  return context;
};

export default NodeDebugContext;
