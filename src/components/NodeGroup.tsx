import React, { useState, useRef, useEffect } from 'react';
import { ClassicPreset } from 'rete';

interface NodeGroupProps {
  id: string;
  title: string;
  color: string;
  nodes: string[];
  position: { x: number; y: number };
  width: number;
  height: number;
  onResize: (id: string, width: number, height: number) => void;
  onMove: (id: string, position: { x: number; y: number }) => void;
  onTitleChange: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Component for node grouping
 * Allows users to visually group related nodes together
 */
export function NodeGroup({
  id,
  title,
  color,
  nodes,
  position,
  width,
  height,
  onResize,
  onMove,
  onTitleChange,
  onDelete
}: NodeGroupProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 });
  
  const groupRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditing]);
  
  // Handle double click on title to edit
  const handleTitleDoubleClick = () => {
    setIsEditing(true);
  };
  
  // Handle title input change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditTitle(e.target.value);
  };
  
  // Handle title input blur or Enter key
  const handleTitleBlur = () => {
    setIsEditing(false);
    onTitleChange(id, editTitle);
  };
  
  // Handle key press in title input
  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditTitle(title);
    }
  };
  
  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === groupRef.current || (e.target as HTMLElement).classList.contains('group-header')) {
      e.preventDefault();
      setIsDragging(true);
      const rect = groupRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  };
  
  // Handle mouse down on resize handle
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      width,
      height,
      x: e.clientX,
      y: e.clientY
    });
  };
  
  // Handle mouse move for dragging or resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newPosition = {
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        };
        onMove(id, newPosition);
      } else if (isResizing) {
        const dx = e.clientX - resizeStart.x;
        const dy = e.clientY - resizeStart.y;
        const newWidth = Math.max(200, resizeStart.width + dx);
        const newHeight = Math.max(100, resizeStart.height + dy);
        onResize(id, newWidth, newHeight);
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };
    
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, resizeStart, id, onMove, onResize]);
  
  // Handle delete button click
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(id);
  };
  
  // Use data attributes instead of inline styles
  const groupDataAttributes = {
    'data-x': position.x,
    'data-y': position.y,
    'data-width': width,
    'data-height': height,
    'data-color': color,
    'data-group-id': id
  };
  
  return (
    <div
      ref={groupRef}
      className={`node-group node-group-${color.replace('#', '')}`}
      onMouseDown={handleMouseDown}
      {...groupDataAttributes}
    >
      <div 
        className="group-header"
        onDoubleClick={handleTitleDoubleClick}
      >
        {isEditing ? (
          <input
            ref={titleInputRef}
            type="text"
            value={editTitle}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="group-title-input"
            aria-label="Group title"
            placeholder="Enter group title"
            title="Edit group title"
          />
        ) : (
          <div className="group-title">{title}</div>
        )}
        <div className="group-controls">
          <span className="group-node-count">{nodes.length} nodes</span>
          <button 
            className="group-delete-btn"
            onClick={handleDelete}
            title="Delete group"
            aria-label="Delete group"
          >
            ×
          </button>
        </div>
      </div>
      <div className="resize-handle" onMouseDown={handleResizeMouseDown}></div>
    </div>
  );
}
