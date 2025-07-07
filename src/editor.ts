import { NodeEditor, ClassicPreset } from 'rete';
import { AreaPlugin, AreaExtensions } from 'rete-area-plugin';
import { ConnectionPlugin } from 'rete-connection-plugin';
import { AutoArrangePlugin } from 'rete-auto-arrange-plugin';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';

// Import all custom nodes
import { ConsoleLogNode } from './nodes/ConsoleLogNode';
import { DiscordWebhookNode } from './nodes/DiscordWebhookNode';
import { KeywordFilterNode } from './nodes/KeywordFilterNode';
import { LLMAgentNode } from './nodes/LLMAgentNode';
import { MemoryReadNode } from './nodes/MemoryReadNode';
import { MemoryWriteNode } from './nodes/MemoryWriteNode';
import { RedditScraperNode } from './nodes/RedditScraperNode';
import { StartNode } from './nodes/StartNode';
import { SummarizerNode } from './nodes/SummarizerNode';

// Types
type Position = { x: number; y: number };
type Node = ClassicPreset.Node & { width: number; height: number };

class Connection<A extends Node, B extends Node> extends ClassicPreset.Connection<A, B> {}

type Schemes = {
    Node: Node;
    Connection: Connection<Node, Node>;
};

type NodeTypes = 'trigger' | 'http' | 'condition' | 'log' | 'console-log' | 'discord-webhook' | 'keyword-filter' | 'llm-agent' | 'memory-read' | 'memory-write' | 'reddit-scraper' | 'start' | 'summarizer';

// Socket for connections
const socket = new ClassicPreset.Socket('socket');

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
  
  // Setup connection plugin
  const connection = new ConnectionPlugin<Schemes, any>();
  area.use(connection);
  
  // Setup auto-arrange
  const arrange = new AutoArrangePlugin<Schemes>();
  area.use(arrange);
  
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
    const nodeTypes = [
        { type: 'start', label: 'Start' },
        { type: 'reddit-scraper', label: 'Reddit Scraper' },
        { type: 'keyword-filter', label: 'Keyword Filter' },
        { type: 'summarizer', label: 'Summarizer' },
        { type: 'llm-agent', label: 'LLM Agent' },
        { type: 'console-log', label: 'Console Log' },
        { type: 'discord-webhook', label: 'Discord Webhook' },
        { type: 'memory-read', label: 'Memory Read' },
        { type: 'memory-write', label: 'Memory Write' }
    ];

    nodeTypes.forEach(nodeType => {
        const node = document.createElement('div');
        node.className = 'node-palette-item';
        node.textContent = nodeType.label;
        node.draggable = true;
        
        node.addEventListener('dragstart', (e: DragEvent) => {
            if (e.dataTransfer) {
                e.dataTransfer.setData('application/node-type', nodeType.type);
                onDragStart(nodeType.type);
            }
        });
        
        container.appendChild(node);
    });
}

// Handle node drop
export function handleNodeDrop(container: HTMLElement, onDrop: (type: string, position: { x: number; y: number }) => void) {
    container.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    container.addEventListener('drop', async (e) => {
        e.preventDefault();
        const type = e.dataTransfer?.getData('application/node-type');
        if (type) {
            const rect = container.getBoundingClientRect();
            const position = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
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
