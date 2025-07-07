import React, { useEffect, useRef } from 'react';
import { ClassicPreset, NodeEditor } from 'rete';
import { AreaPlugin } from 'rete-area-plugin';
import { NodeExecutionResult } from '../types/node.types';
import { NodeScheme } from '../core/BaseNode';
import { updateNodeVisuals } from '../utils/nodeStyles';

// Define NodeView interface to include the el property
interface NodeView {
  el?: HTMLElement;
  [key: string]: any;
}

interface NodeDebugViewProps {
  editor: NodeEditor<NodeScheme> | null;
  area: AreaPlugin<any, any>;
  selectedNode: ClassicPreset.Node | null;
  nodeStates: Map<string, NodeExecutionResult>;
  onNodeSelect: (node: ClassicPreset.Node | null) => void;
}

const NodeDebugView: React.FC<NodeDebugViewProps> = ({
  editor,
  area,
  selectedNode,
  nodeStates,
  onNodeSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const clickHandlerRef = useRef<((event: MouseEvent) => void) | null>(null);

  // Update node visuals when node states change
  useEffect(() => {
    if (!editor || !area) return;

    const nodes = editor.getNodes();
    nodes.forEach(node => {
      const nodeView = area.nodeViews.get(node.id) as NodeView;
      if (nodeView) {
        const state = nodeStates.get((node as any).id);
        if (state) {
          updateNodeVisuals(nodeView, state);
        }
      }
    });
  }, [editor, area, nodeStates]);

  // Handle node selection
  useEffect(() => {
    if (!editor || !area) return;

    const handleNodeClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const nodeElement = target.closest('[data-node-id]');
      
      if (!nodeElement) {
        // Clicked outside any node
        if (!target.closest('.debug-panel')) {
          onNodeSelect(null);
        }
        return;
      }

      const nodeId = nodeElement.getAttribute('data-node-id');
      if (!nodeId) return;

      const node = editor.getNodes().find(n => n.id === nodeId);
      if (node) {
        onNodeSelect(node);
        event.stopPropagation();
      }
    };

    // Store the handler reference for cleanup
    clickHandlerRef.current = handleNodeClick;
    
    // Add click event listener to the editor container
    const editorContainer = area.container;
    if (editorContainer) {
      editorContainer.addEventListener('click', handleNodeClick);

      // Cleanup
      return () => {
        if (clickHandlerRef.current && editorContainer) {
          editorContainer.removeEventListener('click', clickHandlerRef.current);
        }
      };
    }
    return undefined;
  }, [editor, area, onNodeSelect]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!editor || !area) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Close debug panel on Escape key
      if (event.key === 'Escape' && selectedNode) {
        onNodeSelect(null);
      }
      
      // Navigate between nodes with arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        
        const nodes = editor.getNodes();
        if (nodes.length === 0) return;
        
        const currentIndex = selectedNode 
          ? nodes.findIndex(n => n.id === selectedNode.id) 
          : -1;
        
        let nextIndex = currentIndex;
        
        switch (event.key) {
          case 'ArrowUp':
          case 'ArrowLeft':
            nextIndex = currentIndex <= 0 ? nodes.length - 1 : currentIndex - 1;
            break;
          case 'ArrowDown':
          case 'ArrowRight':
            nextIndex = currentIndex >= nodes.length - 1 ? 0 : currentIndex + 1;
            break;
        }
        
        if (nextIndex !== currentIndex) {
          onNodeSelect(nodes[nextIndex]);
          
          // Scroll the node into view
          const nodeView = area.nodeViews.get(nodes[nextIndex].id) as NodeView;
          if (nodeView && nodeView.el) {
            nodeView.el.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'center'
            });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor, selectedNode, onNodeSelect]);

  // Render the debug panel if a node is selected
  if (!selectedNode || !editor) return null;

  return (
    <div 
      ref={containerRef}
      className="absolute bottom-0 left-0 right-0 z-10"
    >
      {selectedNode && (
        <div className="debug-panel bg-white border-t border-gray-200 shadow-lg">
          <div className="flex items-center justify-between p-2 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium">
              {selectedNode.label}
              <span className="ml-2 text-xs text-gray-500">
                {selectedNode.id}
              </span>
            </h3>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => onNodeSelect(null)}
              aria-label="Close debug panel"
              title="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-3 max-h-64 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Type</div>
                <div className="text-sm">{selectedNode.label || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Status</div>
                <div className="text-sm">
                  {nodeStates.get(selectedNode.id ?? '')?.status || 'pending'}
                </div>
              </div>
              {nodeStates.get(selectedNode.id ?? '')?.startTime && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Duration</div>
                  <div className="text-sm">
                    {(() => {
                      const state = nodeStates.get(selectedNode.id ?? '');
                      if (state?.endTime && state?.startTime) {
                        return `${state.endTime - state.startTime}ms`;
                      }
                      return 'Running...';
                    })()}
                  </div>
                </div>
              )}
            </div>
            
            {nodeStates.get(selectedNode.id ?? '')?.error && (
              <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                <div className="font-medium">Error:</div>
                <div className="whitespace-pre-wrap break-words">
                  {nodeStates.get(selectedNode.id ?? '')?.error || 'Unknown error'}
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-1">Data</h4>
                <div className="bg-gray-50 p-2 rounded text-xs font-mono overflow-x-auto">
                  {JSON.stringify((selectedNode as any)?.data || {}, null, 2)}
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-1">Outputs</h4>
                <div className="bg-gray-50 p-2 rounded text-xs font-mono overflow-x-auto">
                  {nodeStates.get(selectedNode.id ?? '')?.output 
                    ? JSON.stringify(nodeStates.get(selectedNode.id ?? '')?.output || {}, null, 2)
                    : 'No output yet'}
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-1">Logs</h4>
                <div className="bg-black text-green-400 p-2 rounded text-xs font-mono overflow-x-auto max-h-32 overflow-y-auto">
                  {(() => {
                    const state = nodeStates.get(selectedNode.id ?? '');
                    if (state?.logs?.length) {
                      return state.logs.map((log: any, i: number) => (
                        <div key={i} className="border-b border-gray-800 py-1">
                          <p className={`${log.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                            {log.message || String(log)}
                          </p>
                        </div>
                      ));
                    }
                    return <>No logs available</>;
                  })()}

                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NodeDebugView;
