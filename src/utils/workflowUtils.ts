import { NodeEditor } from 'rete';
import { Workflow, WorkflowConnection, WorkflowNode } from '../types/node.types';

/**
 * Load a workflow configuration into the editor
 */
export async function loadWorkflow(editor: NodeEditor, workflow: Workflow) {
  if (!editor) return;

  // Clear existing nodes and connections
  await editor.clear();
  
  // Add nodes
  const nodeMap = new Map<string, any>();
  
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
 */
async function createNode(editor: NodeEditor, nodeData: WorkflowNode) {
  const { type, position, data } = nodeData;
  
  // Map node types to their constructors
  const nodeConstructors: Record<string, any> = {
    'start': (await import('../nodes/StartNode')).default,
    'reddit-scraper': (await import('../nodes/RedditScraperNode')).default,
    'keyword-filter': (await import('../nodes/KeywordFilterNode')).default,
    'summarizer': (await import('../nodes/SummarizerNode')).default,
    'llm-agent': (await import('../nodes/LLMAgentNode')).default,
    'console-log': (await import('../nodes/ConsoleLogNode')).default,
    'discord-webhook': (await import('../nodes/DiscordWebhookNode')).default,
    'memory-read': (await import('../nodes/MemoryReadNode')).default,
    'memory-write': (await import('../nodes/MemoryWriteNode')).default,
  };
  
  const NodeConstructor = nodeConstructors[type];
  if (!NodeConstructor) {
    throw new Error(`Unknown node type: ${type}`);
  }
  
  const node = new NodeConstructor(editor);
  
  // Set node position
  node.position = [position.x, position.y];
  
  // Set node data
  Object.assign(node.data, data);
  
  // Add node to editor
  await editor.addNode(node);
  
  return node;
}

/**
 * Export the current workflow configuration
 */
export async function exportWorkflow(editor: NodeEditor): Promise<Workflow> {
  if (!editor) return { nodes: [], connections: [] };
  
  const nodes = editor.getNodes();
  const connections = editor.getConnections();
  
  const workflowNodes: WorkflowNode[] = nodes.map(node => ({
    id: node.id,
    type: node.data.type || 'unknown',
    position: {
      x: node.position[0],
      y: node.position[1]
    },
    data: { ...node.data }
  }));
  
  const workflowConnections: WorkflowConnection[] = connections.map(conn => ({
    id: `conn-${conn.source}-${conn.sourceOutput}-${conn.target}-${conn.targetInput}`,
    source: conn.source,
    sourceOutput: conn.sourceOutput,
    target: conn.target,
    targetInput: conn.targetInput
  }));
  
  return {
    nodes: workflowNodes,
    connections: workflowConnections
  };
}

/**
 * Load a sample workflow by name
 */
export async function loadSampleWorkflow(editor: NodeEditor, name: string) {
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
export function saveWorkflowToLocalStorage(workflow: Workflow, name: string) {
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
