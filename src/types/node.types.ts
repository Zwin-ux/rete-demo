export interface NodeData {
  id: string;
  type: string;
  [key: string]: any;
}

export interface NodeInput {
  name: string;
  type: string;
  value?: any;
}

export interface NodeOutput {
  name: string;
  type: string;
}

export interface NodeControl {
  type: string;
  key: string;
  value: any;
  setValue: (value: any) => void;
}

export interface NodeExecutionResult {
  success: boolean;
  output?: Record<string, any>;
  error?: string;
  logs?: string[];
}

export interface NodeDefinition {
  id: string;
  name: string;
  description: string;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  controls: NodeControl[];
  execute: (inputs: Record<string, any>, context: NodeContext) => Promise<NodeExecutionResult>;
}

export interface NodeContext {
  memory: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    delete: (key: string) => Promise<void>;
  };
  log: (message: string) => void;
  nodeId: string;
}

export interface WorkflowNode extends NodeData {
  position: { x: number; y: number };
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  controls: Record<string, any>;
}

export interface WorkflowConnection {
  id: string;
  source: string;
  sourceOutput: string;
  target: string;
  targetInput: string;
}

export interface Workflow {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
}
