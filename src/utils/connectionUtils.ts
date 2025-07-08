// Connection utility functions for the workflow editor

/**
 * Socket types used in the workflow editor
 */
export enum SocketType {
  EXEC = 'exec',
  DATA = 'data',
  ANY = 'any'
}

/**
 * Check if two sockets are compatible for connection
 * @param sourceType Source socket type
 * @param targetType Target socket type
 * @returns True if the sockets can be connected
 */
export function areSocketsCompatible(sourceType: string, targetType: string): boolean {
  // ANY socket type can connect to any other socket
  if (sourceType === SocketType.ANY || targetType === SocketType.ANY) {
    return true;
  }
  
  // EXEC sockets can only connect to other EXEC sockets
  if (sourceType === SocketType.EXEC) {
    return targetType === SocketType.EXEC;
  }
  
  // DATA sockets can only connect to other DATA sockets
  if (sourceType === SocketType.DATA) {
    return targetType === SocketType.DATA;
  }
  
  // Default to allowing the connection if the types match exactly
  return sourceType === targetType;
}

/**
 * Get the color for a socket based on its type
 * @param socketType Socket type
 * @returns CSS color string
 */
export function getSocketColor(socketType: string): string {
  switch (socketType) {
    case SocketType.EXEC:
      return '#4CAF50'; // Green
    case SocketType.DATA:
      return '#2196F3'; // Blue
    case SocketType.ANY:
      return '#9C27B0'; // Purple
    default:
      return '#757575'; // Gray
  }
}

/**
 * Validate a connection between two nodes
 * @param sourceNode Source node
 * @param sourceOutput Output socket name on source node
 * @param targetNode Target node
 * @param targetInput Input socket name on target node
 * @returns True if the connection is valid
 */
export function validateConnection(
  sourceNode: any,
  sourceOutput: string,
  targetNode: any,
  targetInput: string
): boolean {
  // Don't allow connections to self
  if (sourceNode.id === targetNode.id) {
    return false;
  }
  
  // Get socket types
  const sourceSocket = sourceNode.outputs[sourceOutput];
  const targetSocket = targetNode.inputs[targetInput];
  
  if (!sourceSocket || !targetSocket) {
    return false;
  }
  
  // Check socket compatibility
  return areSocketsCompatible(sourceSocket.socket.name, targetSocket.socket.name);
}

/**
 * Get a list of compatible inputs for a given output socket
 * @param outputSocketType Output socket type
 * @param targetNode Target node
 * @returns Array of compatible input socket names
 */
export function getCompatibleInputs(outputSocketType: string, targetNode: any): string[] {
  const compatibleInputs: string[] = [];
  
  for (const [inputName, input] of Object.entries(targetNode.inputs)) {
    const inputSocketType = (input as any).socket.name;
    if (areSocketsCompatible(outputSocketType, inputSocketType)) {
      compatibleInputs.push(inputName);
    }
  }
  
  return compatibleInputs;
}

/**
 * Get a list of compatible outputs for a given input socket
 * @param inputSocketType Input socket type
 * @param sourceNode Source node
 * @returns Array of compatible output socket names
 */
export function getCompatibleOutputs(inputSocketType: string, sourceNode: any): string[] {
  const compatibleOutputs: string[] = [];
  
  for (const [outputName, output] of Object.entries(sourceNode.outputs)) {
    const outputSocketType = (output as any).socket.name;
    if (areSocketsCompatible(outputSocketType, inputSocketType)) {
      compatibleOutputs.push(outputName);
    }
  }
  
  return compatibleOutputs;
}
