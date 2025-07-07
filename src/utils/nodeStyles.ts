import { ClassicPreset } from 'rete';
import { NodeExecutionResult } from '../types/node.types';

export const NODE_STATUS_STYLES = {
  pending: {
    background: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-800',
    icon: '⏳',
  },
  running: {
    background: 'bg-blue-50',
    border: 'border-blue-400',
    text: 'text-blue-800',
    icon: '⚡',
  },
  success: {
    background: 'bg-green-50',
    border: 'border-green-400',
    text: 'text-green-800',
    icon: '✓',
  },
  error: {
    background: 'bg-red-50',
    border: 'border-red-400',
    text: 'text-red-800',
    icon: '✗',
  },
  skipped: {
    background: 'bg-yellow-50',
    border: 'border-yellow-400',
    text: 'text-yellow-800',
    icon: '➤',
  },
};

export const getNodeStatusStyles = (node: Node, nodeStates: Map<string, NodeExecutionState>) => {
  const state = nodeStates.get(node.id);
  const status = state?.status || 'pending';
  const styles = NODE_STATUS_STYLES[status as keyof typeof NODE_STATUS_STYLES] || NODE_STATUS_STYLES.pending;
  
  return {
    ...styles,
    duration: state?.startTime && state?.endTime 
      ? `${state.endTime - state.startTime}ms` 
      : null,
  };
};

export function updateNodeVisuals(node: ClassicPreset.Node, nodeStates: Map<string, NodeExecutionResult>, element?: HTMLElement) {
  const status = nodeStates.get(node.id)?.status || 'pending';

  if (element) {
    element.dataset.status = status;
  }
}
