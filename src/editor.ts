import { NodeEditor, ClassicPreset } from 'rete';
import { AreaPlugin, AreaExtensions } from 'rete-area-plugin';
import { ConnectionPlugin, Presets as ConnectionPresets } from 'rete-connection-plugin';
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
type NodeTypes = 'trigger' | 'http' | 'condition' | 'log' | 'console-log' | 'discord-webhook' | 'keyword-filter' | 'llm-agent' | 'memory-read' | 'memory-write' | 'reddit-scraper' | 'start' | 'summarizer';

// Socket for connections
const socket = new ClassicPreset.Socket('socket');

// Node factory
export const createNode = (type: string, position: { x: number; y: number }, editor: NodeEditor) => {
    let node;
    
    switch (type) {
        case 'start':
            node = new StartNode(editor);
            break;
        case 'reddit-scraper':
            node = new RedditScraperNode(editor);
            break;
        case 'keyword-filter':
            node = new KeywordFilterNode(editor);
            break;
        case 'summarizer':
            node = new SummarizerNode(editor);
            break;
        case 'llm-agent':
            node = new LLMAgentNode(editor);
            break;
        case 'console-log':
            node = new ConsoleLogNode(editor);
            break;
        case 'discord-webhook':
            node = new DiscordWebhookNode(editor);
            break;
        case 'memory-read':
            node = new MemoryReadNode(editor);
            break;
        case 'memory-write':
            node = new MemoryWriteNode(editor);
            break;
        default:
            throw new Error(`Unknown node type: ${type}`);
    }
    
    node.position = [position.x, position.y];
    return node;
};

// Define schemes for the editor
type EditorSchemes = {
  Node: ClassicPreset.Node;
  Connection: ClassicPreset.Connection<ClassicPreset.Node, ClassicPreset.Node>;
};

// Initialize editor
export async function initEditor(container: HTMLElement) {
  // Create editor and plugins
  const editor = new NodeEditor<EditorSchemes>();
  const area = new AreaPlugin<EditorSchemes, any>(container);
  
  // Setup editor with area plugin
  editor.use(area);
  
  // Setup connection plugin
  const connection = new ConnectionPlugin<EditorSchemes, any>();
  area.use(connection);
  
  // Setup auto-arrange
  const arrange = new AutoArrangePlugin<EditorSchemes>();
  area.use(arrange);
  
  // Enable zoom and pan
  AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
    accumulating: AreaExtensions.accumulateOnCtrl()
  });
  
  // Enable area selection
  AreaExtensions.selectableArea(area);
  
  // Enable grid snapping
  AreaExtensions.snapGrid(area, { size: 10, dynamic: true });

    // Add default nodes
    const startNode = createNode('start', { x: 100, y: 100 }, editor);
    const redditScraperNode = createNode('reddit-scraper', { x: 400, y: 100 }, editor);
    const keywordFilterNode = createNode('keyword-filter', { x: 700, y: 100 }, editor);
    const summarizerNode = createNode('summarizer', { x: 1000, y: 100 }, editor);
    const llmAgentNode = createNode('llm-agent', { x: 1300, y: 100 }, editor);
    const consoleLogNode = createNode('console-log', { x: 1600, y: 100 }, editor);
    const discordWebhookNode = createNode('discord-webhook', { x: 1900, y: 100 }, editor);
    const memoryReadNode = createNode('memory-read', { x: 2200, y: 100 }, editor);
    const memoryWriteNode = createNode('memory-write', { x: 2500, y: 100 }, editor);

    await editor.addNode(startNode);
    await editor.addNode(redditScraperNode);
    await editor.addNode(keywordFilterNode);
    await editor.addNode(summarizerNode);
    await editor.addNode(llmAgentNode);
    await editor.addNode(consoleLogNode);
    await editor.addNode(discordWebhookNode);
    await editor.addNode(memoryReadNode);
    await editor.addNode(memoryWriteNode);

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
    
    return { editor, area };
}

// Helper function to create React root
function createRoot(component: React.ReactNode) {
    const container = document.createElement('div');
    const root = ReactDOM.createRoot(container);
    root.render(component);
    return container;
}

// Export types for other modules
export type { Position, NodeTypes };

// Export editor instance types
export type { NodeEditor, AreaPlugin, ConnectionPlugin, AutoArrangePlugin };

// Extend type declarations for Rete.js
declare module 'rete' {
  interface NodeEditor<Schemes = any> {
    use(plugin: any, options?: any): any;
  }
}

declare module 'rete-area-plugin' {
  interface AreaPlugin<Schemes = any, T = any> {
    use(plugin: any, options?: any): any;
  }
}

declare module 'rete-connection-plugin' {
  interface ConnectionPlugin<Schemes = any, T = any> {
    use(plugin: any, options?: any): any;
  }
}

declare module 'rete-auto-arrange-plugin' {
  interface AutoArrangePlugin<Schemes = any> {
    use(plugin: any, options?: any): any;
  }
}
