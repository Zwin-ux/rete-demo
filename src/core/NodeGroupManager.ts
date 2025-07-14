/**
 * Node Group Manager
 * Manages node groups in the editor
 */

import { NodeEditor } from 'rete';
import { AreaPlugin } from 'rete-area-plugin';
import { NodeScheme } from './BaseNode';
import { v4 as uuidv4 } from 'uuid';

// Define group types
export interface NodeGroup {
  id: string;
  title: string;
  color: string;
  nodes: string[];
  position: { x: number; y: number };
  width: number;
  height: number;
}

// Define default group colors
const GROUP_COLORS = [
  '#3498db', // Blue
  '#2ecc71', // Green
  '#e74c3c', // Red
  '#9b59b6', // Purple
  '#f39c12', // Orange
  '#1abc9c', // Teal
  '#34495e', // Dark Blue
];

export class NodeGroupManager {
  private groups: Map<string, NodeGroup> = new Map();
  private editor: NodeEditor<NodeScheme>;
  private area: AreaPlugin<NodeScheme, any>;
  private groupContainer: HTMLElement;
  private nextColorIndex: number = 0;
  
  constructor(editor: NodeEditor<NodeScheme>, area: AreaPlugin<NodeScheme, any>) {
    this.editor = editor;
    this.area = area;
    
    // Create container for groups
    this.groupContainer = document.createElement('div');
    this.groupContainer.className = 'node-groups-container';
    this.area.container.appendChild(this.groupContainer);
    
    // Set up event listeners
    this.setupListeners();
  }
  
  /**
   * Set up event listeners for node selection and movement
   */
  private setupListeners() {
    // Listen for node selection to update group selection
    this.area.addPipe(context => {
      if (context.type === 'nodeselected') {
        this.handleNodeSelected(context.data.id);
      }
      return context;
    });
    
    // Listen for node movement to update group positions
    this.area.addPipe(context => {
      if (context.type === 'nodetranslated') {
        this.updateGroupsForNodeMovement(context.data.id);
      }
      return context;
    });
    
    // Listen for node removal to update groups
    this.editor.addPipe(context => {
      if (context.type === 'noderemoved') {
        this.removeNodeFromGroups(context.data.id);
      }
      return context;
    });
  }
  
  /**
   * Create a new group with selected nodes
   */
  public createGroup(nodeIds: string[], title: string = 'New Group'): string {
    if (nodeIds.length === 0) return '';
    
    // Calculate group bounds based on node positions
    const bounds = this.calculateBounds(nodeIds);
    
    // Create padding around nodes
    const padding = 30;
    bounds.x -= padding;
    bounds.y -= padding;
    bounds.width += padding * 2;
    bounds.height += padding * 2;
    
    // Create a new group
    const groupId = uuidv4();
    const group: NodeGroup = {
      id: groupId,
      title,
      color: this.getNextColor(),
      nodes: [...nodeIds],
      position: { x: bounds.x, y: bounds.y },
      width: bounds.width,
      height: bounds.height
    };
    
    this.groups.set(groupId, group);
    this.renderGroup(group);
    
    return groupId;
  }
  
  /**
   * Get the next color from the color palette
   */
  private getNextColor(): string {
    const color = GROUP_COLORS[this.nextColorIndex];
    this.nextColorIndex = (this.nextColorIndex + 1) % GROUP_COLORS.length;
    return color;
  }
  
  /**
   * Calculate bounds for a set of nodes
   */
  private calculateBounds(nodeIds: string[]) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    nodeIds.forEach(id => {
      const node = this.editor.getNode(id);
      if (node) {
        const position = (node as any).position || { x: 0, y: 0 };
        const width = (node as any).width || 200;
        const height = (node as any).height || 100;
        
        minX = Math.min(minX, position.x);
        minY = Math.min(minY, position.y);
        maxX = Math.max(maxX, position.x + width);
        maxY = Math.max(maxY, position.y + height);
      }
    });
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
  
  /**
   * Render a group in the editor
   */
  private renderGroup(group: NodeGroup) {
    // Check if group element already exists
    let groupElement = document.querySelector(`[data-group-id="${group.id}"]`) as HTMLElement;
    
    if (!groupElement) {
      // Create new group element
      groupElement = document.createElement('div');
      groupElement.className = 'node-group';
      groupElement.dataset.groupId = group.id;
      this.groupContainer.appendChild(groupElement);
      
      // Create group header
      const header = document.createElement('div');
      header.className = 'group-header';
      groupElement.appendChild(header);
      
      // Create title
      const title = document.createElement('div');
      title.className = 'group-title';
      title.textContent = group.title;
      header.appendChild(title);
      
      // Create controls
      const controls = document.createElement('div');
      controls.className = 'group-controls';
      header.appendChild(controls);
      
      // Create node count
      const nodeCount = document.createElement('span');
      nodeCount.className = 'group-node-count';
      nodeCount.textContent = `${group.nodes.length} nodes`;
      controls.appendChild(nodeCount);
      
      // Create delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'group-delete-btn';
      deleteBtn.textContent = '×';
      deleteBtn.title = 'Delete group';
      deleteBtn.setAttribute('aria-label', 'Delete group');
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        this.deleteGroup(group.id);
      };
      controls.appendChild(deleteBtn);
      
      // Create resize handle
      const resizeHandle = document.createElement('div');
      resizeHandle.className = 'resize-handle';
      groupElement.appendChild(resizeHandle);
      
      // Set up drag behavior
      this.setupDragBehavior(groupElement, group);
      
      // Set up resize behavior
      this.setupResizeBehavior(resizeHandle, group);
      
      // Set up title editing
      this.setupTitleEditing(title, group);
    }
    
    // Update group element styles
    groupElement.style.setProperty('--group-x', `${group.position.x}px`);
    groupElement.style.setProperty('--group-y', `${group.position.y}px`);
    groupElement.style.setProperty('--group-width', `${group.width}px`);
    groupElement.style.setProperty('--group-height', `${group.height}px`);
    groupElement.style.setProperty('--group-color', group.color);
    groupElement.style.setProperty('--group-bg-color', `${group.color}20`);
    groupElement.style.setProperty('--group-header-bg-color', `${group.color}40`);
    
    // Update node count
    const nodeCount = groupElement.querySelector('.group-node-count') as HTMLElement;
    if (nodeCount) {
      nodeCount.textContent = `${group.nodes.length} nodes`;
    }
  }
  
  /**
   * Set up drag behavior for a group
   */
  private setupDragBehavior(element: HTMLElement, group: NodeGroup) {
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    const handleMouseDown = (e: MouseEvent) => {
      if (e.target === element || (e.target as HTMLElement).classList.contains('group-header')) {
        e.preventDefault();
        isDragging = true;
        const rect = element.getBoundingClientRect();
        dragOffset = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newPosition = {
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        };
        this.moveGroup(group.id, newPosition);
      }
    };
    
    const handleMouseUp = () => {
      isDragging = false;
    };
    
    element.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
  
  /**
   * Set up resize behavior for a group
   */
  private setupResizeBehavior(handle: HTMLElement, group: NodeGroup) {
    let isResizing = false;
    let resizeStart = { width: 0, height: 0, x: 0, y: 0 };
    
    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing = true;
      resizeStart = {
        width: group.width,
        height: group.height,
        x: e.clientX,
        y: e.clientY
      };
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const dx = e.clientX - resizeStart.x;
        const dy = e.clientY - resizeStart.y;
        const newWidth = Math.max(200, resizeStart.width + dx);
        const newHeight = Math.max(100, resizeStart.height + dy);
        this.resizeGroup(group.id, newWidth, newHeight);
      }
    };
    
    const handleMouseUp = () => {
      isResizing = false;
    };
    
    handle.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
  
  /**
   * Set up title editing for a group
   */
  private setupTitleEditing(titleElement: HTMLElement, group: NodeGroup) {
    titleElement.addEventListener('dblclick', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = group.title;
      input.className = 'group-title-input';
      input.setAttribute('aria-label', 'Group title');
      input.setAttribute('placeholder', 'Enter group title');
      input.setAttribute('title', 'Edit group title');
      
      titleElement.replaceWith(input);
      input.focus();
      
      const handleBlur = () => {
        this.renameGroup(group.id, input.value);
        input.replaceWith(titleElement);
      };
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          handleBlur();
        } else if (e.key === 'Escape') {
          input.replaceWith(titleElement);
        }
      };
      
      input.addEventListener('blur', handleBlur);
      input.addEventListener('keydown', handleKeyDown);
    });
  }
  
  /**
   * Move a group to a new position
   */
  public moveGroup(groupId: string, position: { x: number; y: number }) {
    const group = this.groups.get(groupId);
    if (!group) return;
    
    // Update group position
    group.position = position;
    
    // Update group element
    this.renderGroup(group);
    
    // Move nodes with the group
    const deltaX = position.x - group.position.x;
    const deltaY = position.y - group.position.y;
    
    group.nodes.forEach(nodeId => {
      const node = this.editor.getNode(nodeId);
      if (node && (node as any).position) {
        const currentPos = (node as any).position;
        (node as any).position = {
          x: currentPos.x + deltaX,
          y: currentPos.y + deltaY
        };
        this.area.update('node', nodeId);
      }
    });
  }
  
  /**
   * Resize a group
   */
  public resizeGroup(groupId: string, width: number, height: number) {
    const group = this.groups.get(groupId);
    if (!group) return;
    
    group.width = width;
    group.height = height;
    
    this.renderGroup(group);
  }
  
  /**
   * Rename a group
   */
  public renameGroup(groupId: string, title: string) {
    const group = this.groups.get(groupId);
    if (!group) return;
    
    group.title = title || 'Untitled Group';
    
    this.renderGroup(group);
  }
  
  /**
   * Delete a group
   */
  public deleteGroup(groupId: string) {
    const group = this.groups.get(groupId);
    if (!group) return;
    
    // Remove group element
    const groupElement = document.querySelector(`[data-group-id="${groupId}"]`);
    if (groupElement) {
      groupElement.remove();
    }
    
    // Remove group from map
    this.groups.delete(groupId);
  }
  
  /**
   * Add a node to a group
   */
  public addNodeToGroup(groupId: string, nodeId: string) {
    const group = this.groups.get(groupId);
    if (!group) return;
    
    // Add node to group if not already in it
    if (!group.nodes.includes(nodeId)) {
      group.nodes.push(nodeId);
      
      // Update group bounds to include the new node
      const updatedBounds = this.calculateBounds(group.nodes);
      group.position = { x: updatedBounds.x - 30, y: updatedBounds.y - 30 };
      group.width = updatedBounds.width + 60;
      group.height = updatedBounds.height + 60;
      
      this.renderGroup(group);
    }
  }
  
  /**
   * Remove a node from a group
   */
  public removeNodeFromGroup(groupId: string, nodeId: string) {
    const group = this.groups.get(groupId);
    if (!group) return;
    
    // Remove node from group
    const index = group.nodes.indexOf(nodeId);
    if (index !== -1) {
      group.nodes.splice(index, 1);
      
      // If no nodes left, delete the group
      if (group.nodes.length === 0) {
        this.deleteGroup(groupId);
      } else {
        // Update group bounds
        const updatedBounds = this.calculateBounds(group.nodes);
        group.position = { x: updatedBounds.x - 30, y: updatedBounds.y - 30 };
        group.width = updatedBounds.width + 60;
        group.height = updatedBounds.height + 60;
        
        this.renderGroup(group);
      }
    }
  }
  
  /**
   * Remove a node from all groups
   */
  public removeNodeFromGroups(nodeId: string) {
    this.groups.forEach((group, groupId) => {
      this.removeNodeFromGroup(groupId, nodeId);
    });
  }
  
  /**
   * Handle node selection
   */
  private handleNodeSelected(nodeId: string) {
    // Highlight groups containing the selected node
    this.groups.forEach((group, groupId) => {
      const groupElement = document.querySelector(`[data-group-id="${groupId}"]`) as HTMLElement;
      if (groupElement) {
        if (group.nodes.includes(nodeId)) {
          groupElement.classList.add('group-highlighted');
        } else {
          groupElement.classList.remove('group-highlighted');
        }
      }
    });
  }
  
  /**
   * Update groups when nodes are moved
   */
  private updateGroupsForNodeMovement(nodeId: string) {
    this.groups.forEach((group, groupId) => {
      if (group.nodes.includes(nodeId)) {
        // Update group bounds
        const updatedBounds = this.calculateBounds(group.nodes);
        group.position = { x: updatedBounds.x - 30, y: updatedBounds.y - 30 };
        group.width = updatedBounds.width + 60;
        group.height = updatedBounds.height + 60;
        
        this.renderGroup(group);
      }
    });
  }
  
  /**
   * Get all groups
   */
  public getGroups(): NodeGroup[] {
    return Array.from(this.groups.values());
  }
  
  /**
   * Get a group by ID
   */
  public getGroup(groupId: string): NodeGroup | undefined {
    return this.groups.get(groupId);
  }
  
  /**
   * Get groups containing a node
   */
  public getGroupsForNode(nodeId: string): NodeGroup[] {
    return this.getGroups().filter(group => group.nodes.includes(nodeId));
  }
  
  /**
   * Clear all groups
   */
  public clearGroups() {
    this.groups.clear();
    this.groupContainer.innerHTML = '';
  }
  
  /**
   * Serialize groups for saving
   */
  public serialize(): any {
    return Array.from(this.groups.entries()).map(([id, group]) => ({
      id,
      title: group.title,
      color: group.color,
      nodes: group.nodes,
      position: group.position,
      width: group.width,
      height: group.height
    }));
  }
  
  /**
   * Deserialize groups from saved data
   */
  public deserialize(data: any[]) {
    this.clearGroups();
    
    data.forEach(item => {
      this.groups.set(item.id, {
        id: item.id,
        title: item.title,
        color: item.color,
        nodes: item.nodes,
        position: item.position,
        width: item.width,
        height: item.height
      });
      
      this.renderGroup(this.groups.get(item.id)!);
    });
  }
}
