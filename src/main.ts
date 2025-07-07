import { initEditor, initNodePalette, createNode } from './editor';
import { loadWorkflow } from './utils/workflowUtils';
import { DEMO_CONFIG, isDemoMode } from './config/demo';

declare global {
  interface Window {
    editor: any; // Add editor to window for debugging
  }
}

// Show demo mode banner if in demo mode
function showDemoBanner() {
  if (!isDemoMode()) return;
  
  const banner = document.createElement('div');
  Object.assign(banner.style, {
    position: 'fixed',
    top: '10px',
    right: '10px',
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '10px 15px',
    borderRadius: '4px',
    zIndex: '1000',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold'
  });
  banner.textContent = 'DEMO MODE';
  
  document.body.appendChild(banner);
}

async function initializeApp() {
  const container = document.getElementById('editor') as HTMLElement;
  const palette = document.getElementById('node-palette') as HTMLElement;
  
  if (!container || !palette) {
    console.error('Could not find editor or palette element');
    return;
  }

  // Show demo banner if needed
  showDemoBanner();

  try {
    // Initialize editor
    const { editor, area } = await initEditor(container);
    
    // Initialize node palette
    initNodePalette(palette, (type) => {
      console.log('Dragging node:', type);
    });
    
    // Handle node drop on the editor
    container.addEventListener('drop', async (e: DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer?.getData('application/node-type');
        if (type) {
          const node = createNode(type, editor, area);
          await editor.addNode(node);

          const rect = container.getBoundingClientRect();
          const position = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          };
          await area.translate(node.id, position);
        }
    });
    
    // Allow drop
    container.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    // Make editor available globally for debugging
    window.editor = editor;
    
    // Load demo workflow if in demo mode
    if (isDemoMode() && DEMO_CONFIG.DEFAULT_WORKFLOW) {
      try {
        // Load the default workflow
        const workflow = await fetch(`/workflows/${DEMO_CONFIG.DEFAULT_WORKFLOW}.json`)
          .then(res => res.json());
        
        if (workflow) {
          await loadWorkflow(editor as any, workflow);
          console.log('Loaded demo workflow:', DEMO_CONFIG.DEFAULT_WORKFLOW);
          
          // Auto-run the workflow if configured
          if (DEMO_CONFIG.UI?.AUTO_RUN) {
            setTimeout(() => {
              const runButton = document.querySelector('[data-action="run-workflow"]') as HTMLElement;
              if (runButton) {
                runButton.click();
                console.log('Auto-running workflow...');
              }
            }, 1000);
          }
        }
      } catch (error) {
        const err = error as Error;
        console.error('Failed to load demo workflow:', err);
      }
    }

  } catch (error) {
    const err = error as Error;
    console.error('Failed to initialize application:', err);
    
    // Show error message to user
    const errorDiv = document.createElement('div');
    Object.assign(errorDiv.style, {
      color: 'red',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#fff8f8',
      border: '1px solid #ffcccc',
      borderRadius: '4px',
      margin: '20px',
      maxWidth: '800px'
    });
    
    errorDiv.innerHTML = `
      <h2 style="margin-top: 0; color: #d32f2f;">Error Initializing Application</h2>
      <p><strong>${err.name}:</strong> ${err.message || 'Unknown error occurred'}</p>
      <p>Please check the browser console for more details.</p>
      ${isDemoMode() ? '<p>This is a demo instance. Some features may be limited.</p>' : ''}
      <button onclick="window.location.reload()" style="
        background: #4CAF50;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
      ">Reload Page</button>
    `;
    
    if (container) {
      container.innerHTML = '';
      container.appendChild(errorDiv);
    }
  }
}

// Start the application
document.addEventListener('DOMContentLoaded', initializeApp);
