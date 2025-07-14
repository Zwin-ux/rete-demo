import { NodeEditor, ClassicPreset } from 'rete';
import { AreaPlugin, AreaExtensions } from 'rete-area-plugin';
import { ConnectionPlugin } from 'rete-connection-plugin';
import { AutoArrangePlugin } from 'rete-auto-arrange-plugin';
import { ReactPlugin, Presets, ReactArea2D } from 'rete-react-plugin';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { HistoryManager } from './core/HistoryManager';
import { NodeGroupManager } from './core/NodeGroupManager';
import { UndoRedoControls } from './components/UndoRedoControls';
import { Header } from './components/Header';
import { initNodeGroupStyling } from './utils/nodeGroupUtils';
import { validateConnection, getSocketColor, SocketType } from './utils/connectionUtils';
import { CustomSocket } from './components/CustomSocket';vvvvv
import { ConsoleLogNode } from './nodes/ConsoleLogNode';
import { DiscordWebhookNode } from './nodes/DiscordWebhookNode';
import { HttpRequestNode } from './nodes/HttpRequestNode';
import { KeywordFilterNode } from './nodes/KeywordFilterNode';
import { LLMAgentNode } from './nodes/LLMAgentNode';
import { MemoryReadNode } from './nodes/MemoryReadNode';
import { MemoryWriteNode } from './nodes/MemoryWriteNode';
import { RedditScraperNode } from './nodes/RedditScraperNode';
import { StartNode } from './nodes/StartNode';
import { SummarizerNode } from './nodes/SummarizerNode';
import { WebSocketNode } from './nodes/WebSocketNode';
import { TwitterScraperNode } from './nodes/TwitterScraperNode';
import { LinkedInScraperNode } from './nodes/LinkedInScraperNode';
import { DataTransformNode } from './nodes/DataTransformNode';

// Types
type Position = { x: number; y: number };
type Node = ClassicPreset.Node & { width: number; height: number };

class Connection<A extends Node, B extends Node> extends ClassicPreset.Connection<A, B> {}

type Schemes = {
    Node: Node;
    Connection: Connection<Node, Node>;
};

type NodeTypes = 'trigger' | 'http' | 'condition' | 'log' | 'console-log' | 'discord-webhook' | 'keyword-filter' | 'llm-agent' | 'memory-read' | 'memory-write' | 'reddit-scraper' | 'start' | 'summarizer' | 'http-request' | 'websocket' | 'twitter-scraper' | 'linkedin-scraper' | 'data-transform';

// Define socket types for different connection types
const execSocket = new ClassicPreset.Socket('exec');
const dataSocket = new ClassicPreset.Socket('data');
const anySocket = new ClassicPreset.Socket('any');

// Socket types defined in connectionUtils.ts

// Socket map for easy access
export const sockets = {
  [SocketType.EXEC]: execSocket,
  [SocketType.DATA]: dataSocket,
  [SocketType.ANY]: anySocket
};

// Node factory
export const createNode = (type: string, editor: NodeEditor<Schemes>, area: AreaPlugin<Schemes, any>) => {
    switch (type) {
        case 'start':
            return new StartNode(editor, area);
        case 'reddit-scraper':
            return new RedditScraperNode(editor, area);
        case 'keyword-filter':
            return new KeywordFilterNode(editor, area);
        case 'summarizer':
            return new SummarizerNode(editor, area);
        case 'llm-agent':
            return new LLMAgentNode(editor, area);
        case 'console-log':
            return new ConsoleLogNode(editor, area);
        case 'discord-webhook':
            return new DiscordWebhookNode(editor, area);
        case 'memory-read':
            return new MemoryReadNode(editor, area);
        case 'memory-write':
            return new MemoryWriteNode(editor, area);
        case 'http-request':
            return new HttpRequestNode(editor, area);
        case 'websocket':
            return new WebSocketNode(editor, area);
        case 'twitter-scraper':
            return new TwitterScraperNode(editor, area);
        case 'linkedin-scraper':
            return new LinkedInScraperNode(editor, area);
        case 'data-transform':
            return new DataTransformNode(editor, area);
        default:
            throw new Error(`Unknown node type: ${type}`);
    }
};

// Initialize editor
export async function initEditor(container: HTMLElement) {
  // Create parent container for the editor
  const editorContainer = document.createElement('div');
  editorContainer.className = 'editor-container';
  container.appendChild(editorContainer);
  
  // Create editor and plugins
  const editor = new NodeEditor<Schemes>();
  const area = new AreaPlugin<Schemes, any>(editorContainer);
  
  // Initialize history manager for undo/redo functionality
  const historyManager = new HistoryManager(editor);
  
  // Initialize node group manager for node grouping functionality
  const nodeGroupManager = new NodeGroupManager(editor, area);
  
  // Create and render the header
  const headerContainer = document.createElement('div');
  headerContainer.className = 'editor-header-container';
  container.insertBefore(headerContainer, editorContainer);
  
  // Render the Header component with React
  const headerRoot = ReactDOM.createRoot(headerContainer);
  headerRoot.render(React.createElement(Header, { historyManager }));
  
  // Setup editor with area plugin
  editor.use(area);
  
  // Setup connection plugin with validation and styling
  const connection = new ConnectionPlugin<Schemes, any>();
  
  // Configure connection plugin with validation and custom styling
  connection.addPipe(context => {
    if (context.type === 'connectionpick' || context.type === 'connectioncreate') {
      // Customize connection appearance based on socket type
      const sourceOutput = context.data.source?.socket;
      if (sourceOutput && context.data.element) {
        const socketType = sourceOutput.name;
        const color = getSocketColor(socketType);
        
        // Apply color to connection
        context.data.element.style.stroke = color;
        
        // Add CSS class based on socket type
        context.data.element.classList.remove('exec-connection', 'data-connection', 'any-connection');
        
        if (socketType === SocketType.EXEC) {
          context.data.element.classList.add('exec-connection');
        } else if (socketType === SocketType.DATA) {
          context.data.element.classList.add('data-connection');
        } else {
          context.data.element.classList.add('any-connection');
        }
        
        // Create path element for animation if it doesn't exist
        if (!context.data.element.querySelector('path')) {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', context.data.element.getAttribute('d') || '');
          context.data.element.appendChild(path);
        }
      }
    }
    
    // Add CSS classes to sockets based on their type
    if (context.type === 'render') {
      setTimeout(() => {
        // Find all socket elements
        const socketElements = document.querySelectorAll('.socket');
        
        // Add appropriate CSS classes based on socket type
        socketElements.forEach(socketEl => {
          const socketKey = socketEl.getAttribute('data-socket');
          const nodeId = socketEl.getAttribute('data-node-id');
          const ioType = socketEl.getAttribute('data-io-type');
          
          if (socketKey && nodeId) {
            // Find the node and socket to determine its type
            const node = editor.getNode(nodeId);
            if (node) {
              const socket = ioType === 'input' 
                ? node.inputs[socketKey]?.socket 
                : node.outputs[socketKey]?.socket;
              
              if (socket) {
                // Remove existing socket type classes
                socketEl.classList.remove('exec-socket', 'data-socket', 'any-socket');
                
                // Add appropriate class based on socket type
                if (socket.name === SocketType.EXEC) {
                  socketEl.classList.add('exec-socket');
                } else if (socket.name === SocketType.DATA) {
                  socketEl.classList.add('data-socket');
                } else {
                  socketEl.classList.add('any-socket');
                }
              }
            }
          }
        });
      }, 100); // Short delay to ensure elements are rendered
    }
    
    // Validate connections between nodes
    if (context.type === 'connectioncreate') {
      const { source, target, sourceOutput, targetInput } = context.data;
      
      if (!source || !target || !sourceOutput || !targetInput) {
        return false; // Prevent connection if missing data
      }
      
      // Use the validateConnection utility to check compatibility
      const isValid = validateConnection(source, sourceOutput, target, targetInput);
      
      if (!isValid) {
        console.log('Connection validation failed:', { source, target, sourceOutput, targetInput });
        return false; // Prevent invalid connections
      }
    }
    
    return context; // Allow the connection
  });
  
  area.use(connection);
  
  // Setup auto-arrange
  const arrange = new AutoArrangePlugin<Schemes>();
  area.use(arrange);

  // Setup React renderer
  const reactRender = new ReactPlugin<Schemes>();
  area.use(reactRender);
  
  // Only use the classic preset which is available in this version
  try {
    // @ts-ignore - Ignore type incompatibility with preset
    reactRender.addPreset(Presets.classic.setup());
  } catch (error) {
    console.warn('Failed to add classic preset:', error);
  }
  
  // Enable zoom and pan
  AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
    accumulating: AreaExtensions.accumulateOnCtrl()
  });
  
  // Enable grid snapping
  AreaExtensions.snapGrid(area, { size: 10, dynamic: true });

    const startNode = new StartNode(editor, area);
    await editor.addNode(startNode);
    await area.translate(startNode.id, { x: 0, y: 0 });

    const redditNode = new RedditScraperNode(editor, area);
    await editor.addNode(redditNode);
    await area.translate(redditNode.id, { x: 270, y: 0 });

    await editor.addConnection(
      new ClassicPreset.Connection(startNode, 'exec', redditNode, 'exec')
    );

    try {
        // Auto arrange nodes if available
        if (arrange && typeof (arrange as any).layout === 'function') {
            await (arrange as any).layout();
        }

        // Enable zoom and pan if available
        AreaExtensions.zoomAt(area, editor.getNodes());
    } catch (error) {
        console.warn('Error during editor initialization:', error);
    }
    
    return { editor, area };
}

// Initialize node palette
export function initNodePalette(container: HTMLElement, onDragStart: (type: string) => void) {
    // Clear existing content
    container.innerHTML = '';
    
    // Create node palette header
    const header = document.createElement('h3');
    header.textContent = 'Node Palette';
    container.appendChild(header);
    
    // Define node categories
    const categories = [
        {
            name: 'Basic',
            category: 'basic',
            nodes: [
                { label: 'Start', type: 'start' },
                { label: 'Console Log', type: 'console-log' },
            ]
        },
        {
            name: 'Network',
            category: 'network',
            nodes: [
                { label: 'HTTP Request', type: 'http-request' },
                { label: 'WebSocket', type: 'websocket' },
                { label: 'Discord Webhook', type: 'discord-webhook' },
            ]
        },
        {
            name: 'AI & Data',
            category: 'ai-data',
            nodes: [
                { label: 'LLM Agent', type: 'llm-agent' },
                { label: 'Keyword Filter', type: 'keyword-filter' },
                { label: 'Summarizer', type: 'summarizer' },
                { label: 'Data Transform', type: 'data-transform' },
            ]
        },
        {
            name: 'Storage',
            category: 'storage',
            nodes: [
                { label: 'Memory Read', type: 'memory-read' },
                { label: 'Memory Write', type: 'memory-write' },
            ]
        },
        {
            name: 'Data Sources',
            category: 'data-sources',
            nodes: [
                { label: 'Reddit Scraper', type: 'reddit-scraper' },
                { label: 'Twitter Scraper', type: 'twitter-scraper' },
                { label: 'LinkedIn Scraper', type: 'linkedin-scraper' },
            ]
        }
    ];
    
    // Create node categories and items
    categories.forEach(category => {
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'node-category-header';
        categoryHeader.textContent = category.name;
        container.appendChild(categoryHeader);
        
        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'node-category-container';
        container.appendChild(categoryContainer);
        
        category.nodes.forEach(nodeType => {
            const node = document.createElement('div');
            node.className = 'node-palette-item';
            node.textContent = nodeType.label;
            node.dataset.nodeType = nodeType.type;
            node.dataset.category = category.category;
            node.dataset.description = `${nodeType.label} - ${category.name} node`;
            node.draggable = true;
            node.tabIndex = 0; // Make focusable for keyboard navigation
            
            // Add tooltip
            node.title = nodeType.label;
            
            node.addEventListener('dragstart', (e) => {
                if (e.dataTransfer) {
                    e.dataTransfer.setData('application/node-type', nodeType.type);
                    console.log('Drag started for type:', nodeType.type, 'dataTransfer:', e.dataTransfer);
                    onDragStart(nodeType.type);
                    document.getElementById('editor')?.classList.add('dragging');
                }
            });

            node.addEventListener('dragend', () => {
                document.getElementById('editor')?.classList.remove('dragging');
            });
            
            // Add keyboard support for node selection
            node.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    // Simulate drag and drop when Enter or Space is pressed
                    const editorElement = document.getElementById('editor');
                    if (editorElement) {
                        const rect = editorElement.getBoundingClientRect();
                        const position = {
                            x: rect.width / 2,
                            y: rect.height / 2
                        };
                        onDragStart(nodeType.type);
                        // Create a custom event to handle the node creation
                        const event = new CustomEvent('nodePaletteKeySelect', {
                            detail: {
                                type: nodeType.type,
                                position
                            }
                        });
                        document.dispatchEvent(event);
                    }
                }
            });
            
            categoryContainer.appendChild(node);
        });
    });
    
    // Add search functionality with fuzzy search
    const searchBox = document.createElement('input');
    searchBox.type = 'text';
    searchBox.placeholder = 'Search nodes...';
    searchBox.className = 'node-palette-search';
    container.insertBefore(searchBox, container.firstChild);
    
    // Create search results container (initially hidden)
    const searchResultsContainer = document.createElement('div');
    searchResultsContainer.className = 'search-results';
    searchResultsContainer.style.display = 'none';
    container.insertBefore(searchResultsContainer, searchBox.nextSibling);
    
    // Import fuzzy search dynamically to avoid circular dependencies
    import('./utils/fuzzySearch').then(({ sortByFuzzyScore }) => {
        searchBox.addEventListener('input', (e: Event) => {
            const target = e.target as HTMLInputElement;
            const searchTerm = target.value.trim();
            
            // Get all node items
            const nodeItems = container.querySelectorAll('.node-palette-item');
            const categoryHeaders = container.querySelectorAll('.node-category-header');
            const categoryContainers = container.querySelectorAll('.node-category-container');
            
            if (searchTerm) {
                // Use fuzzy search to sort and filter nodes
                const allNodes = Array.from(nodeItems);
                const searchResults = sortByFuzzyScore(
                    allNodes, 
                    searchTerm, 
                    (node) => {
                        const el = node as HTMLElement;
                        return `${el.textContent} ${el.dataset.nodeType} ${el.dataset.category} ${el.dataset.description}`;
                    }
                );
                
                // Hide all nodes first
                nodeItems.forEach(item => (item as HTMLElement).style.display = 'none');
                
                // Show matched nodes with highlighting
                searchResults.forEach(result => {
                    const node = result.item as HTMLElement;
                    node.style.display = 'block';
                    
                    // Add score indicator for debugging (can be removed in production)
                    node.dataset.score = result.score.toFixed(2);
                });
                
                // Hide empty categories
                categoryContainers.forEach((container, index) => {
                    const visibleNodes = Array.from(container.querySelectorAll('.node-palette-item')).some(
                        item => (item as HTMLElement).style.display !== 'none'
                    );
                    
                    (container as HTMLElement).style.display = visibleNodes ? 'block' : 'none';
                    (categoryHeaders[index] as HTMLElement).style.display = visibleNodes ? 'block' : 'none';
                });
                
                // If no results, show a message
                const hasResults = searchResults.length > 0;
                if (!hasResults) {
                    const noResultsDiv = document.createElement('div');
                    noResultsDiv.className = 'no-results';
                    noResultsDiv.textContent = 'No matching nodes found';
                    // Clear and update the search results container
                    searchResultsContainer.innerHTML = '';
                    searchResultsContainer.appendChild(noResultsDiv);
                    searchResultsContainer.style.display = 'block';
                } else {
                    searchResultsContainer.style.display = 'none';
                }
            } else {
                // Show all nodes when search is empty
                nodeItems.forEach(item => (item as HTMLElement).style.display = 'block');
                categoryHeaders.forEach(header => (header as HTMLElement).style.display = 'block');
                categoryContainers.forEach(container => (container as HTMLElement).style.display = 'block');
                searchResultsContainer.style.display = 'none';
            }
        });
    });
    
    // Add keyboard navigation between nodes
    setupKeyboardNavigation(container);
}

// Helper function to set up keyboard navigation between nodes
function setupKeyboardNavigation(container: HTMLElement) {
    container.addEventListener('keydown', (e) => {
        if (!['Tab', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
        
        const focusableItems = Array.from(
            container.querySelectorAll('.node-palette-item:not([style*="display: none"])') 
        ) as HTMLElement[];
        
        if (focusableItems.length === 0) return;
        
        const currentIndex = focusableItems.findIndex(item => item === document.activeElement);
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = currentIndex < focusableItems.length - 1 ? currentIndex + 1 : 0;
            focusableItems[nextIndex].focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusableItems.length - 1;
            focusableItems[prevIndex].focus();
        }
    });
}

// Handle node drop
export function handleNodeDrop(container: HTMLElement, area: AreaPlugin<Schemes, any>, onDrop: (type: string, position: { x: number; y: number }) => void) {
    container.addEventListener('dragover', e => {
        e.preventDefault();
        console.log('Drag over event', e.clientX, e.clientY);
    });

    container.addEventListener('drop', e => {
        e.preventDefault();
        const type = e.dataTransfer?.getData('application/node-type');
        console.log('Drop event for type:', type, 'dataTransfer:', e.dataTransfer);

        if (type) {
            // Get position from event coordinates instead of area.pointer
            const rect = container.getBoundingClientRect();
            const position = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            console.log('Node dropped at position:', position);
            onDrop(type, position);
        }
    });
}

// Helper function to create React root
function createRoot(component: React.ReactNode) {
    const container = document.createElement('div');
    const root = ReactDOM.createRoot(container);
    root.render(component);
    return container;
}

// Export types for other modules
export type { Position, NodeTypes, Schemes, NodeEditor, AreaPlugin, ConnectionPlugin, AutoArrangePlugin };
