import { Node } from 'rete';
import { NodeExecutionState } from '../types/node.types';

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

export const updateNodeVisuals = (
  node: Node,
  nodeStates: Map<string, NodeExecutionState>,
  container: HTMLElement | null
) => {
  if (!container) return;
  
  const state = nodeStates.get(node.id);
  const status = state?.status || 'pending';
  const styles = NODE_STATUS_STYLES[status as keyof typeof NODE_STATUS_STYLES] || NODE_STATUS_STYLES.pending;
  
  // Update node container
  const nodeElement = container.querySelector(`[data-node-id="${node.id}"]`);
  if (nodeElement) {
    // Remove all status classes
    Object.values(NODE_STATUS_STYLES).forEach(style => {
      nodeElement.classList.remove(
        style.background,
        style.border,
        style.text
      );
    });
    
    // Add current status classes
    nodeElement.classList.add(
      styles.background,
      styles.border,
      'border-2',
      'transition-all',
      'duration-300'
    );
    
    // Add status indicator
    let statusIndicator = nodeElement.querySelector('.node-status-indicator');
    if (!statusIndicator) {
      statusIndicator = document.createElement('div');
      statusIndicator.className = 'node-status-indicator absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold';
      nodeElement.appendChild(statusIndicator);
    }
    
    // Update status indicator
    statusIndicator.textContent = styles.icon;
    statusIndicator.className = `node-status-indicator absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${styles.background} ${styles.border} border-2`;
    
    // Add tooltip for execution time
    if (state?.startTime && state?.endTime) {
      const duration = state.endTime - state.startTime;
      statusIndicator.title = `Execution time: ${duration}ms`;
    }
  }
};
