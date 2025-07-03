import type { NodeEditor } from 'rete';
import type { Workflow, WorkflowConnection, WorkflowNode } from '../types/node.types';
import { BaseNode } from '../core/BaseNode';

// Define local types for Rete.js components
type ReteNode = {
  id: string;
  data: Record<string, unknown>;
  position: [number, number];
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
};

type ReteConnection = {
  id: string;
  source: string;
  target: string;
  sourceOutput: string;
  targetInput: string;
};

// Define the node editor scheme type
type NodeScheme = {
  Node: {
    id: string;
    data: Record<string, unknown>;
    position: [number, number];
  };
  Connection: {
    id: string;
    source: string;
    target: string;
    sourceOutput: string;
    targetInput: string;
  };
};

// Define types for the node editor
type NodeType = Node<{ type: string }> & {
  data: {
    type: string;
    [key: string]: unknown;
  };
  position: [number, number];
};

type ConnectionType = Connection<{ source: string; target: string }> & {
  source: string;
  target: string;
  sourceOutput: string;
  targetInput: string;
};

// Define a type for the node constructor map
type NodeConstructor = new (editor: NodeEditor<NodeScheme>) => BaseNode;

/**
 * Load a workflow configuration into the editor
 * @param editor The node editor instance
 * @param workflow The workflow to load
 */
export async function loadWorkflow(
  editor: NodeEditor<NodeScheme>, 
  workflow: Workflow
): Promise<void> {
  if (!editor) return;

  // Clear existing nodes and connections
  await editor.clear();
  
  // Add nodes
  const nodeMap = new Map<string, BaseNode>();
  
  for (const nodeData of workflow.nodes) {
    try {
      const node = await createNode(editor, nodeData);
      nodeMap.set(nodeData.id, node);
    } catch (error) {
      console.error(`Failed to create node ${nodeData.id}:`, error);
    }
  }
  
  // Add connections
  for (const conn of workflow.connections) {
    try {
      const sourceNode = nodeMap.get(conn.source);
      const targetNode = nodeMap.get(conn.target);
      
      if (!sourceNode || !targetNode) {
        console.warn(`Skipping connection ${conn.id}: source or target node not found`);
        continue;
      }
      
      if (sourceNode && targetNode) {
        await editor.connect(
          sourceNode.outputs.get(conn.sourceOutput),
          targetNode.inputs.get(conn.targetInput)
        );
      }
    } catch (error) {
      console.error(`Failed to create connection ${conn.id}:`, error);
    }
  }
  
  // Arrange nodes to prevent overlap
  await editor.view.arrange({
    nodeMargin: 100,
    depth: null,
    animate: true
  });
  
  return editor;
}

/**
 * Create a node from workflow node data
 * @param editor The node editor instance
 * @param nodeData The node data
 * @returns The created node or null if creation fails
 */
async function createNode(
  editor: NodeEditor<NodeScheme>, 
  nodeData: WorkflowNode
): Promise<BaseNode | null> {
  const { type, position } = nodeData;
  
  try {
    // Dynamically import the node module based on type
    let NodeClass: any;
    
    switch (type) {
      case 'start-node':
        NodeClass = (await import('../nodes/StartNode')).StartNode;
        break;
      case 'reddit-scraper':
        NodeClass = (await import('../nodes/RedditScraperNode')).RedditScraperNode;
        break;
      // Add other node types here
      default:
        throw new Error(`Unknown node type: ${type}`);
    }
    
    if (!NodeClass) {
      throw new Error(`Node class not found for type: ${type}`);
    }
    
    // Create the node instance
    const node = new NodeClass(editor);
    
    // Set node data
    if (nodeData.data) {
      Object.assign(node.data, nodeData.data);
    }
    
    // Set node position if available
    if (position) {
      (node as any).position = [
        position.x || 0,
        position.y || 0
      ];
    }
    
    // Add the node to the editor
    await editor.addNode(node as any);
    return node;
    
  } catch (error) {
    console.error(`Error creating node ${nodeData.id}:`, error);
    return null;
  }
}

/**
 * Export the current workflow configuration
 */
/**
 * Export the current workflow configuration
 * @param editor The node editor instance
 * @returns The exported workflow
 */
export async function exportWorkflow(
  editor: NodeEditor<NodeScheme>
): Promise<Workflow> {
  if (!editor) return { nodes: [], connections: [] };
  
  const nodes = editor.getNodes() as unknown as Array<Node<{ type: string }> & { position: [number, number] }>;
  const connections = editor.getConnections() as unknown as Array<Connection>;
  
  const workflowNodes: WorkflowNode[] = nodes.map(node => {
    const nodeData = {
      id: node.id,
      type: node.data?.type || 'unknown',
      position: { 
        x: node.position?.[0] || 0, 
        y: node.position?.[1] || 0 
      },
      data: { ...node.data },
      inputs: {},
      outputs: {},
      controls: {}
    };
    return nodeData;
  });
  
  const workflowConnections = connections
    .map(connection => {
      if (!connection.source || !connection.target) {
        console.warn('Invalid connection found, skipping:', connection);
        return null;
      }
      
      return {
        id: connection.id,
        source: connection.source,
        sourceOutput: connection.sourceOutput,
        target: connection.target,
        targetInput: connection.targetInput
      };
    })
    .filter((conn): conn is WorkflowConnection => conn !== null);
  
  // Create the workflow object with required properties
  const workflow: Workflow = {
    id: `workflow-${Date.now()}`,
    name: 'Untitled Workflow',
    nodes: workflowNodes,
    connections: workflowConnections,
    viewport: { x: 0, y: 0, zoom: 1 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  return workflow;
}

/**
 * Load a sample workflow by name
 */
/**
 * Load a sample workflow by name
 * @param editor The node editor instance
 * @param name The name of the sample workflow
 */
export async function loadSampleWorkflow(
  editor: NodeEditor<NodeScheme>, 
  name: string
): Promise<void> {
  try {
    const workflow = await import(`../workflows/${name}.json`);
    return loadWorkflow(editor, workflow.default || workflow);
  } catch (error) {
    console.error(`Failed to load sample workflow ${name}:`, error);
    throw error;
  }
}

/**
 * Save workflow to local storage
 */
/**
 * Save workflow to local storage
 * @param workflow The workflow to save
 * @param name The name to save the workflow as
 */
export function saveWorkflowToLocalStorage(
  workflow: Workflow, 
  name: string
): void {
  try {
    const workflows = getWorkflowsFromLocalStorage();
    workflows[name] = workflow;
    localStorage.setItem('rete-workflows', JSON.stringify(workflows));
    return true;
  } catch (error) {
    console.error('Failed to save workflow to local storage:', error);
    return false;
  }
}

/**
 * Get all saved workflows from local storage
 */
/**
 * Get all saved workflows from local storage
 * @returns A record of workflow names to workflows
 */
export function getWorkflowsFromLocalStorage(): Record<string, Workflow> {
  try {
    const data = localStorage.getItem('rete-workflows');
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Failed to load workflows from local storage:', error);
    return {};
  }
}

/**
 * Delete a workflow from local storage
 */
/**
 * Delete a workflow from local storage
 * @param name The name of the workflow to delete
 * @returns True if the workflow was deleted, false otherwise
 */
export function deleteWorkflowFromLocalStorage(name: string): boolean {
  try {
    const workflows = getWorkflowsFromLocalStorage();
    if (!workflows[name]) return false;
    
    delete workflows[name];
    localStorage.setItem('rete-workflows', JSON.stringify(workflows));
    return true;
  } catch (error) {
    console.error('Failed to delete workflow from local storage:', error);
    return false;
  }
}
