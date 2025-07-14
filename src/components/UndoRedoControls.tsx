import React, { useEffect, useState } from 'react';
import { HistoryManager } from '../core/HistoryManager';

interface UndoRedoControlsProps {
  historyManager: HistoryManager;
}

/**
 * Component for undo/redo controls in the editor
 */
export function UndoRedoControls({ historyManager }: UndoRedoControlsProps) {
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  useEffect(() => {
    // Initialize state
    const state = historyManager.getState();
    setCanUndo(state.canUndo);
    setCanRedo(state.canRedo);

    // Listen for history changes
    const handleHistoryChanged = (event: CustomEvent) => {
      setCanUndo(event.detail.canUndo);
      setCanRedo(event.detail.canRedo);
    };

    document.addEventListener('history-changed', handleHistoryChanged as EventListener);

    // Setup keyboard shortcuts
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Z for undo
      if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        historyManager.undo();
      }
      // Ctrl+Y or Ctrl+Shift+Z for redo
      if ((event.ctrlKey && event.key === 'y') || 
          (event.ctrlKey && event.shiftKey && event.key === 'z')) {
        event.preventDefault();
        historyManager.redo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('history-changed', handleHistoryChanged as EventListener);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [historyManager]);

  return (
    <div className="undo-redo-controls">
      <button 
        className={`undo-button ${!canUndo ? 'disabled' : ''}`}
        onClick={() => historyManager.undo()}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        aria-label="Undo last action"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M3 10h10a8 8 0 0 1 8 8v2M3 10l6-6M3 10l6 6" />
        </svg>
        <span className="sr-only">Undo</span>
      </button>
      
      <button 
        className={`redo-button ${!canRedo ? 'disabled' : ''}`}
        onClick={() => historyManager.redo()}
        disabled={!canRedo}
        title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
        aria-label="Redo last undone action"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M21 10H11a8 8 0 0 0-8 8v2M21 10l-6-6M21 10l-6 6" />
        </svg>
        <span className="sr-only">Redo</span>
      </button>
    </div>
  );
}
