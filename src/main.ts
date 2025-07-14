import { initEditor, initNodePalette, createNode, handleNodeDrop } from './editor';
import { loadWorkflow } from './utils/workflowUtils';
import { DEMO_CONFIG, isDemoMode } from './config/demo';
import { createAIAgentDemoWorkflow } from './workflows/aiAgentDemo';
import { createSocialMediaAggregator } from './workflows/social-media-aggregator';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { ApiConfigPanel } from './components/ApiConfigPanel';

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
  const palette = document.querySelector('.node-palette') as HTMLElement;
  
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
    handleNodeDrop(container, area, async (type, position) => {
      const node = createNode(type, editor, area);
      await editor.addNode(node);
      await area.translate(node.id, position);
    });

    // Make editor available globally for debugging
    window.editor = editor;
    
    // Add API configuration panel
    const apiConfigContainer = document.createElement('div');
    document.body.appendChild(apiConfigContainer);
    const apiConfigRoot = ReactDOM.createRoot(apiConfigContainer);
    apiConfigRoot.render(React.createElement(ApiConfigPanel, { editor }));
    
    // Add workflow selection dropdown
    const workflowSelector = document.createElement('select');
    workflowSelector.style.position = 'absolute';
    workflowSelector.style.top = '10px';
    workflowSelector.style.left = '10px';
    workflowSelector.style.zIndex = '1000';
    workflowSelector.style.padding = '8px';
    workflowSelector.style.borderRadius = '4px';
    
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a workflow...';
    workflowSelector.appendChild(defaultOption);
    
    const aiAgentOption = document.createElement('option');
    aiAgentOption.value = 'ai-agent';
    aiAgentOption.textContent = 'AI Agent Workflow';
    workflowSelector.appendChild(aiAgentOption);
    
    const socialMediaOption = document.createElement('option');
    socialMediaOption.value = 'social-media';
    socialMediaOption.textContent = 'Social Media Aggregator';
    workflowSelector.appendChild(socialMediaOption);
    
    document.body.appendChild(workflowSelector);
    
    workflowSelector.addEventListener('change', async () => {
      // Clear the editor
      editor.getNodes().forEach(node => editor.removeNode(node.id));
      
      // Load the selected workflow
      if (workflowSelector.value === 'ai-agent') {
        try {
          await createAIAgentDemoWorkflow(editor, area);
          console.log('Loaded AI Agent Demo Workflow');
        } catch (error) {
          console.error('Failed to load AI Agent Demo Workflow:', error);
        }
      } else if (workflowSelector.value === 'social-media') {
        try {
          await createSocialMediaAggregator(editor, area);
          console.log('Loaded Social Media Aggregator Workflow');
        } catch (error) {
          console.error('Failed to load Social Media Aggregator Workflow:', error);
        }
      }
    });
    
    // Load the AI Agent Demo Workflow by default
    try {
      await createAIAgentDemoWorkflow(editor, area);
      console.log('Loaded AI Agent Demo Workflow');
    } catch (error) {
      const err = error as Error;
      console.error('Failed to load AI Agent Demo Workflow:', err);
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
