// Base type for all node data
export interface NodeData {
  id: string;
  name: string;
  type: string;
  [key: string]: unknown;
}

// Supported input/output types
export type NodeValueType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'object' 
  | 'array' 
  | 'any'
  | 'RedditPost[]'
  | 'event';

export interface NodeInput {
  name: string;
  type: NodeValueType;
  value?: unknown;
  required?: boolean;
  description?: string;
}

export interface NodeOutput {
  name: string;
  type: NodeValueType;
  description?: string;
}

// Supported control types
export type ControlType = 
  | 'text' 
  | 'number' 
  | 'select' 
  | 'checkbox' 
  | 'slider' 
  | 'code'
  | 'toggle'
  | 'password'
  | 'textarea'
  | 'color'
  | 'button';

export interface NodeControl<T = unknown> {
  type: ControlType;
  key: string;
  label?: string;
  value?: T; // Made optional as some controls like buttons don't have a value
  options?: { label: string; value: T }[];
  min?: number;
  max?: number;
  step?: number;
  description?: string;
  placeholder?: string; // Added placeholder
  onChange?: (value: T) => void; // Added onChange
  onClick?: () => void; // Added onClick for button type
  disabled?: boolean; // Added disabled property
  setValue?: (value: T) => void; // Made optional
}

// Result of executing a node
export interface NodeExecutionResult {
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
  logs?: string[];
  executionTime?: number;
  status?: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  startTime?: number;
  endTime?: number;
}

// Context available to nodes during execution
export interface NodeContext {
  memory: {
    get: <T = unknown>(key: string) => Promise<T | undefined>;
    set: <T = unknown>(key: string, value: T) => Promise<void>;
    delete: (key: string) => Promise<boolean>;
    clear: () => Promise<void>;
  };
  log: (message: string, level?: 'info' | 'warn' | 'error') => void;
  nodeId: string;
  abortSignal?: AbortSignal;
}

// Definition of a node type
export interface NodeDefinition<I = Record<string, unknown>, O = Record<string, unknown>> {
  id: string;
  name: string;
  description: string;
  category?: string;
  icon?: string;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  controls: NodeControl[];
  execute: (inputs: I, context: NodeContext) => Promise<O>;
}

// Position of a node in the editor
export interface NodePosition {
  x: number;
  y: number;
}

// Size of a node in the editor
export interface NodeSize {
  width: number;
  height: number;
}

export interface WorkflowNode<T = Record<string, unknown>> {
  id: string;
  type: string;
  position: NodePosition;
  data: T;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  controls: Record<string, unknown>;
  selected?: boolean;
  dragging?: boolean;
}

// Represents a connection between nodes in a workflow
export interface WorkflowConnection {
  id: string;
  source: string;
  sourceOutput: string;
  target: string;
  targetInput: string;
  animated?: boolean;
  data?: Record<string, unknown>;
}

// Represents a complete workflow
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

// Type guard for checking if a value is a valid NodeValueType
export function isNodeValueType(value: unknown): value is NodeValueType {
  const validTypes: NodeValueType[] = [
    'string',
    'number',
    'boolean',
    'object',
    'array',
    'any',
    'RedditPost[]'
  ];
  return typeof value === 'string' && validTypes.includes(value as NodeValueType);
}
