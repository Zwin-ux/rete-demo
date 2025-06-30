import { NodeEditor, ClassicPreset } from 'rete';
import { AreaPlugin, AreaExtensions } from 'rete-area-plugin';
import { ConnectionPlugin, Presets as ConnectionPresets } from 'rete-connection-plugin';
import { AutoArrangePlugin } from 'rete-auto-arrange-plugin';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';

// Types
type Position = { x: number; y: number };
type NodeTypes = 'trigger' | 'http' | 'condition' | 'log';

// Socket for connections
const socket = new ClassicPreset.Socket('socket');

// Custom node class that extends ClassicPreset.Node
class CustomNode extends ClassicPreset.Node {
  width = 180;
  height = 100;
  position: [number, number] = [0, 0];
  
  constructor(label: string) {
    super(label);
  }
  
  addInputControl(key: string, label: string) {
    const input = new ClassicPreset.Input(socket, label);
    this.addInput(key, input);
    return input;
  }
  
  addOutputControl(key: string, label: string) {
    const output = new ClassicPreset.Output(socket, label);
    this.addOutput(key, output);
    return output;
  }
}

// Node types
class TriggerNode extends CustomNode {
    constructor() {
        super('Trigger');
        this.addOutputControl('output', 'Output');
    }
}

class HttpNode extends CustomNode {
    constructor() {
        super('HTTP Request');
        this.addInputControl('input', 'Input');
        this.addOutputControl('output', 'Output');
    }
}

class ConditionNode extends CustomNode {
    constructor() {
        super('Condition');
        this.addInputControl('input', 'Input');
        this.addOutputControl('true', 'True');
        this.addOutputControl('false', 'False');
    }
}

class LogNode extends CustomNode {
    constructor() {
        super('Log');
        this.addInputControl('input', 'Input');
    }
}

// Node factory
export const createNode = (type: string, position: { x: number; y: number }) => {
    let node;
    
    switch (type) {
        case 'trigger':
            node = new TriggerNode();
            break;
        case 'http':
            node = new HttpNode();
            break;
        case 'condition':
            node = new ConditionNode();
            break;
        case 'log':
            node = new LogNode();
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
  
  // Enable zoom controls
  AreaExtensions.zoomAt(area, editor.getNodes());
  
  // Enable area selection
  AreaExtensions.selectableArea(area);
  
  // Enable grid snapping
  AreaExtensions.snapGrid(area, { size: 10, dynamic: true });

    // Add default nodes
    const trigger = createNode('trigger', { x: 100, y: 100 });
    const http = createNode('http', { x: 400, y: 100 });
    const condition = createNode('condition', { x: 400, y: 250 });
    const log = createNode('log', { x: 700, y: 100 });

    await editor.addNode(trigger);
    await editor.addNode(http);
    await editor.addNode(condition);
    await editor.addNode(log);

    try {
        // Auto arrange nodes if available
        if (arrange && typeof (arrange as any).layout === 'function') {
            await (arrange as any).layout();
        }

        // Enable zoom and pan if available
        if ('zoom' in area) {
            (area as any).zoom(0.8);
        }
    } catch (error) {
        console.warn('Error during editor initialization:', error);
    }
    
    return { editor, area };
}

// Initialize node palette
export function initNodePalette(container: HTMLElement, onDragStart: (type: string) => void) {
    const nodeTypes = [
        { type: 'trigger', label: 'Trigger' },
        { type: 'http', label: 'HTTP Request' },
        { type: 'condition', label: 'Condition' },
        { type: 'log', label: 'Log' }
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
    
    AreaExtensions.snapGrid(area, { size: 20 });
    AreaExtensions.zoomAt(area, editor.getNodes());

    return { editor, area, render };
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
export { CustomNode, TriggerNode, HttpNode, ConditionNode, LogNode };

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
