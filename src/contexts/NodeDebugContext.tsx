import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ClassicPreset, NodeEditor } from 'rete';
import { NodeExecutionResult } from '../types/node.types';

interface NodeDebugContextType {
  selectedNode: ClassicPreset.Node | null;
  nodeStates: Map<string, NodeExecutionResult>;
  selectNode: (node: ClassicPreset.Node | null) => void;
  updateNodeState: (nodeId: string, state: NodeExecutionResult) => void;
  clearNodeStates: () => void;
}

const NodeDebugContext = createContext<NodeDebugContextType | undefined>(undefined);

export const NodeDebugProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedNode, setSelectedNode] = useState<ClassicPreset.Node | null>(null);
  const [nodeStates, setNodeStates] = useState<Map<string, NodeExecutionResult>>(new Map());

  const updateNodeState = useCallback((nodeId: string, state: NodeExecutionResult) => {
    setNodeStates(prev => {
      const newStates = new Map(prev);
      newStates.set(nodeId, state);
      return newStates;
    });
  }, []);

  const clearNodeStates = useCallback(() => {
    setNodeStates(new Map());
  }, []);

  const selectNode = useCallback((node: ClassicPreset.Node | null) => {
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
