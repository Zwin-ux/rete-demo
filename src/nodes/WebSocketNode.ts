import { ClassicPreset, NodeEditor } from 'rete';
import { AreaPlugin } from 'rete-area-plugin';
import { BaseNode, NodeScheme } from '../core/BaseNode';
import { NodeContext } from '../types/node.types';
import { SocketType } from '../utils/connectionUtils';

interface WebSocketData {
  url: string;
  autoReconnect: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

export class WebSocketNode extends BaseNode<WebSocketData> {
  private webSocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: number | null = null;
  private isConnected = false;

  constructor(editor: NodeEditor<NodeScheme>, area: AreaPlugin<NodeScheme, any>) {
    super(editor, area, 'websocket', 'WebSocket', {
      url: 'wss://echo.websocket.org',
      autoReconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5
    });
    
    // Execution inputs
    this.addExecInput('connect', 'Connect');
    this.addExecInput('disconnect', 'Disconnect');
    this.addExecInput('send', 'Send');
    
    // Data inputs
    this.addDataInput('message', 'Message');
    this.addDataInput('url', 'URL');
    
    // Execution outputs
    this.addExecOutput('connected', 'Connected');
    this.addExecOutput('disconnected', 'Disconnected');
    this.addExecOutput('error', 'Error');
    
    // Data outputs
    this.addDataOutput('message', 'Message');
    this.addDataOutput('status', 'Status');
  }

  async executeNode(
    inputs: {
      connect?: boolean;
      disconnect?: boolean;
      send?: boolean;
      message?: any;
    },
    context: NodeContext
  ): Promise<{
    connected?: boolean;
    disconnected?: boolean;
    message?: any;
    error?: boolean;
  }> {
    // Handle connect action
    if (inputs.connect) {
      return this.handleConnect();
    }
    
    // Handle disconnect action
    if (inputs.disconnect) {
      return this.handleDisconnect();
    }
    
    // Handle send action
    if (inputs.send && inputs.message) {
      return this.handleSend(inputs.message);
    }
    
    // Default response if no specific action
    return {};
  }
  
  private async handleConnect(): Promise<{ connected: boolean; error?: boolean }> {
    if (this.isConnected) {
      this.info('WebSocket already connected');
      return { connected: true };
    }
    
    try {
      this.info(`Connecting to WebSocket at ${this.data.url}`);
      
      // In demo mode, simulate WebSocket connection
      if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate connection delay
        
        this.isConnected = true;
        this.info('WebSocket connected (simulated)');
        
        // Simulate receiving a message after connection
        setTimeout(() => {
          this.handleMessageReceived({ type: 'welcome', message: 'Connected to simulated WebSocket server' });
        }, 1000);
        
        return { connected: true };
      }
      
      // Real WebSocket connection (for production)
      this.webSocket = new WebSocket(this.data.url);
      
      return new Promise((resolve) => {
        if (!this.webSocket) {
          resolve({ connected: false, error: true });
          return;
        }
        
        this.webSocket.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.info('WebSocket connected');
          resolve({ connected: true });
        };
        
        this.webSocket.onclose = () => {
          this.handleDisconnection();
        };
        
        this.webSocket.onerror = (error) => {
          this.error(`WebSocket error: ${error}`);
          resolve({ connected: false, error: true });
        };
        
        this.webSocket.onmessage = (event) => {
          this.handleMessageReceived(event.data);
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.error(`WebSocket connection failed: ${errorMessage}`);
      return { connected: false, error: true };
    }
  }
  
  private async handleDisconnect(): Promise<{ disconnected: boolean }> {
    if (!this.isConnected) {
      this.info('WebSocket already disconnected');
      return { disconnected: true };
    }
    
    try {
      this.info('Disconnecting WebSocket');
      
      // In demo mode, simulate WebSocket disconnection
      if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate disconnection delay
        
        this.isConnected = false;
        this.info('WebSocket disconnected (simulated)');
        
        return { disconnected: true };
      }
      
      // Real WebSocket disconnection (for production)
      if (this.webSocket) {
        this.webSocket.close();
        this.webSocket = null;
      }
      
      this.isConnected = false;
      this.info('WebSocket disconnected');
      
      return { disconnected: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.error(`WebSocket disconnection failed: ${errorMessage}`);
      return { disconnected: false };
    }
  }
  
  private async handleSend(message: any): Promise<{ error?: boolean }> {
    if (!this.isConnected) {
      this.error('Cannot send message: WebSocket not connected');
      return { error: true };
    }
    
    try {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);
      this.info(`Sending message: ${messageString}`);
      
      // In demo mode, simulate sending message
      if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate sending delay
        
        this.info('Message sent (simulated)');
        
        // Simulate echo response
        setTimeout(() => {
          this.handleMessageReceived(message);
        }, 500);
        
        return {};
      }
      
      // Real WebSocket send (for production)
      if (this.webSocket) {
        this.webSocket.send(messageString);
      }
      
      this.info('Message sent');
      return {};
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.error(`Failed to send message: ${errorMessage}`);
      return { error: true };
    }
  }
  
  private handleMessageReceived(data: any): void {
    try {
      let parsedData = data;
      
      // Try to parse the data if it's a string
      if (typeof data === 'string') {
        try {
          parsedData = JSON.parse(data);
        } catch {
          // If parsing fails, keep the original string
          parsedData = data;
        }
      }
      
      this.info(`Received message: ${typeof parsedData === 'object' ? JSON.stringify(parsedData) : parsedData}`);
      
      // Trigger the message output
      this.triggerOutput('message', parsedData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.error(`Error processing received message: ${errorMessage}`);
      this.triggerOutput('error', true);
    }
  }
  
  private handleDisconnection(): void {
    this.isConnected = false;
    this.info('WebSocket disconnected');
    this.triggerOutput('disconnected', true);
    
    // Handle auto-reconnect if enabled
    if (this.data.autoReconnect && this.reconnectAttempts < this.data.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.data.maxReconnectAttempts})...`);
      
      if (this.reconnectTimer !== null) {
        clearTimeout(this.reconnectTimer);
      }
      
      this.reconnectTimer = window.setTimeout(() => {
        this.handleConnect();
      }, this.data.reconnectInterval);
    }
  }
  
  private triggerOutput(outputName: string, data: any): void {
    // This is a placeholder for triggering outputs in a real workflow engine
    // In a complete implementation, this would notify connected nodes
    this.info(`Output triggered: ${outputName}`);
  }
  
  // Clean up resources when the node is destroyed
  async onDestroy(): Promise<void> {
    await super.onDestroy();
    
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
    }
    
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }
  }
}
