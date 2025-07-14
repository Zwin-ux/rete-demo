import React, { useState } from 'react';
import { UndoRedoControls } from './UndoRedoControls';
import { HistoryManager } from '../core/HistoryManager';
import { NodeGroupManager } from '../core/NodeGroupManager';

interface HeaderProps {
  historyManager: HistoryManager;
  nodeGroupManager?: NodeGroupManager;
}

/**
 * Header component for the editor
 * Contains controls for undo/redo and other editor actions
 */
export const Header: React.FC<HeaderProps> = ({ historyManager, nodeGroupManager }) => {
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Handle group creation
  const handleCreateGroup = () => {
    if (!nodeGroupManager) return;
    
    setIsCreatingGroup(true);
    // Add a class to the editor to indicate group creation mode
    document.querySelector('.editor-container')?.classList.add('group-creation-mode');
    
    // Show a message to the user
    const notification = document.createElement('div');
    notification.className = 'editor-notification';
    notification.textContent = 'Select nodes to group, then click "Create Group" again';
    document.querySelector('.editor-container')?.appendChild(notification);
    
    // Store the current selection
    const selectedNodes: string[] = [];
    
    // Listen for node selection
    const selectHandler = (e: Event) => {
      const target = e.target as HTMLElement;
      const nodeElement = target.closest('.node') as HTMLElement;
      
      if (nodeElement) {
        const nodeId = nodeElement.dataset.nodeId;
        if (nodeId && !selectedNodes.includes(nodeId)) {
          selectedNodes.push(nodeId);
          nodeElement.classList.add('group-selected');
        } else if (nodeId) {
          // Deselect if already selected
          const index = selectedNodes.indexOf(nodeId);
          if (index !== -1) {
            selectedNodes.splice(index, 1);
            nodeElement.classList.remove('group-selected');
          }
        }
      }
    };
    
    // Add click event listener to the editor
    document.querySelector('.editor-container')?.addEventListener('click', selectHandler);
    
    // Update the create group button to finalize selection
    const createGroupButton = document.querySelector('.create-group-btn') as HTMLButtonElement;
    if (createGroupButton) {
      createGroupButton.textContent = 'Create Group';
      createGroupButton.onclick = () => {
        // Remove the event listener
        document.querySelector('.editor-container')?.removeEventListener('click', selectHandler);
        
        // Remove the notification
        notification.remove();
        
        // Remove the group creation mode class
        document.querySelector('.editor-container')?.classList.remove('group-creation-mode');
        
        // Remove the selected class from nodes
        document.querySelectorAll('.group-selected').forEach(el => {
          el.classList.remove('group-selected');
        });
        
        // Create the group if there are selected nodes
        if (selectedNodes.length > 0) {
          nodeGroupManager.createGroup(selectedNodes, 'New Group');
        }
        
        // Reset the button
        createGroupButton.textContent = 'Group Nodes';
        createGroupButton.onclick = handleCreateGroup;
        
        setIsCreatingGroup(false);
      };
    }
  };

  return (
    <div className="editor-header">
      <div className="editor-title">RETE.js Workflow Editor</div>
      <div className="editor-controls">
        {nodeGroupManager && (
          <button 
            className="create-group-btn"
            onClick={handleCreateGroup}
            disabled={isCreatingGroup}
            title="Select nodes to group together"
          >
            {isCreatingGroup ? 'Select Nodes' : 'Group Nodes'}
          </button>
        )}
        <UndoRedoControls historyManager={historyManager} />
      </div>
    </div>
  );
};
