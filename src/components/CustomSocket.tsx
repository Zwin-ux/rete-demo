import React from 'react';
import { ClassicPreset } from 'rete';
import { SocketType } from '../utils/connectionUtils';

// Custom socket component with styling based on socket type
export function CustomSocket(props: { 
  name: string; 
  socket: ClassicPreset.Socket; 
  io: { 
    nodeId: string; 
    key: string; 
    type: 'input' | 'output' 
  }
}) {
  const { socket } = props;
  const socketType = socket.name;
  
  // Determine socket class based on socket type
  let socketClass = 'any-socket';
  if (socketType === SocketType.EXEC) {
    socketClass = 'exec-socket';
  } else if (socketType === SocketType.DATA) {
    socketClass = 'data-socket';
  }

  return (
    <div 
      className={`socket ${socketClass}`}
      title={`${socketType} socket`}
      data-type={socketType}
      data-socket={props.io.key}
      data-io-type={props.io.type}
      data-node-id={props.io.nodeId}
    />
  );
}
