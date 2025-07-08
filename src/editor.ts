import { NodeEditor, ClassicPreset } from 'rete';
import { AreaPlugin, AreaExtensions } from 'rete-area-plugin';
import { ConnectionPlugin } from 'rete-connection-plugin';
import { AutoArrangePlugin } from 'rete-auto-arrange-plugin';
import { ReactPlugin, Presets, ReactArea2D } from 'rete-react-plugin';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { validateConnection, getSocketColor, SocketType } from './utils/connectionUtils';
import { CustomSocket } from './components/CustomSocket';

// Import all custom nodes
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

// Types
type Position = { x: number; y: number };
type Node = ClassicPreset.Node & { width: number; height: number };

class Connection<A extends Node, B extends Node> extends ClassicPreset.Connection<A, B> {}

type Schemes = {
    Node: Node;
    Connection: Connection<Node, Node>;
};

type NodeTypes = 'trigger' | 'http' | 'condition' | 'log' | 'console-log' | 'discord-webhook' | 'keyword-filter' | 'llm-agent' | 'memory-read' | 'memory-write' | 'reddit-scraper' | 'start' | 'summarizer' | 'http-request' | 'websocket';

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
        default:
            throw new Error(`Unknown node type: ${type}`);
    }
};

// Initialize editor
export async function initEditor(container: HTMLElement) {
  // Create editor and plugins
  const editor = new NodeEditor<Schemes>();
  const area = new AreaPlugin<Schemes, any>(container);
  
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
    // Group nodes by category for better organization
    const categories = [
        {
            name: 'Basic',
            nodes: [
                { type: 'start', label: 'Start' },
                { type: 'console-log', label: 'Console Log' }
            ]
        },
        {
            name: 'Network',
            nodes: [
                { type: 'http-request', label: 'HTTP Request' },
                { type: 'websocket', label: 'WebSocket' },
                { type: 'discord-webhook', label: 'Discord Webhook' }
            ]
        },
        {
            name: 'AI & Data',
            nodes: [
                { type: 'reddit-scraper', label: 'Reddit Scraper' },
                { type: 'keyword-filter', label: 'Keyword Filter' },
                { type: 'summarizer', label: 'Summarizer' },
                { type: 'llm-agent', label: 'LLM Agent' }
            ]
        },
        {
            name: 'Storage',
            nodes: [
                { type: 'memory-read', label: 'Memory Read' },
                { type: 'memory-write', label: 'Memory Write' }
            ]
        }
    ];
    
    // Create category containers and add nodes to them
    categories.forEach(category => {
        // Create category header
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'node-category-header';
        categoryHeader.textContent = category.name;
        container.appendChild(categoryHeader);
        
        // Create category container
        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'node-category-container';
        container.appendChild(categoryContainer);
        
        // Add nodes to this category
        category.nodes.forEach(nodeType => {
            const node = document.createElement('div');
            node.className = 'node-palette-item';
            node.textContent = nodeType.label;
            node.draggable = true;
            
            // Add data attribute for filtering
            node.dataset.category = category.name.toLowerCase().replace(/\s+/g, '-');
            node.dataset.nodeType = nodeType.type;
            
            node.addEventListener('dragstart', (e: DragEvent) => {
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
            
            categoryContainer.appendChild(node);
        });
    });
    
    // Add search functionality to filter nodes
    const searchBox = document.createElement('input');
    searchBox.type = 'text';
    searchBox.placeholder = 'Search nodes...';
    searchBox.className = 'node-palette-search';
    container.insertBefore(searchBox, container.firstChild);
    
    searchBox.addEventListener('input', (e: Event) => {
        const target = e.target as HTMLInputElement;
        const searchTerm = target.value.toLowerCase();
        
        // Get all node items
        const nodeItems = container.querySelectorAll('.node-palette-item');
        const categoryHeaders = container.querySelectorAll('.node-category-header');
        const categoryContainers = container.querySelectorAll('.node-category-container');
        
        // Reset visibility
        categoryHeaders.forEach(header => (header as HTMLElement).style.display = 'block');
        categoryContainers.forEach(container => (container as HTMLElement).style.display = 'block');
        
        if (searchTerm) {
            // Filter nodes based on search term
            nodeItems.forEach(item => {
                const nodeLabel = item.textContent?.toLowerCase() || '';
                const nodeType = (item as HTMLElement).dataset.nodeType?.toLowerCase() || '';
                const visible = nodeLabel.includes(searchTerm) || nodeType.includes(searchTerm);
                (item as HTMLElement).style.display = visible ? 'block' : 'none';
            });
            
            // Hide empty categories
            categoryContainers.forEach((container, index) => {
                const visibleNodes = Array.from(container.querySelectorAll('.node-palette-item')).some(
                    item => (item as HTMLElement).style.display !== 'none'
                );
                
                (container as HTMLElement).style.display = visibleNodes ? 'block' : 'none';
                (categoryHeaders[index] as HTMLElement).style.display = visibleNodes ? 'block' : 'none';
            });
        } else {
            // Show all nodes when search is empty
            nodeItems.forEach(item => (item as HTMLElement).style.display = 'block');
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
