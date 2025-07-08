import { ClassicPreset, NodeEditor } from 'rete';
import { AreaPlugin } from 'rete-area-plugin';
import { BaseNode, NodeScheme } from '../core/BaseNode';
import { NodeContext } from '../types/node.types';
import { SocketType } from '../utils/connectionUtils';
import { NetworkUtil } from '../config/network';

const socket = new ClassicPreset.Socket('socket');
const dataSocket = new ClassicPreset.Socket('data');

interface HttpRequestData {
  url: string;
  method: string;
  headers: string;
  body: string;
  timeout: number;
  demoMode: boolean;
}

export class HttpRequestNode extends BaseNode<HttpRequestData> {
  constructor(editor: NodeEditor<NodeScheme>, area: AreaPlugin<NodeScheme, any>) {
    super(editor, area, 'http-request', 'HTTP Request', {
      url: 'https://jsonplaceholder.typicode.com/posts',
      method: 'GET',
      headers: '{}',
      body: '',
      timeout: 5000,
      demoMode: true
    });

    // Add execution inputs/outputs
    this.addExecInput('exec', 'Execute');
    this.addExecOutput('success', 'Success');
    this.addExecOutput('error', 'Error');

    // Add data inputs
    this.addDataInput('url', 'URL');
    this.addDataInput('method', 'Method');
    this.addDataInput('headers', 'Headers');
    this.addDataInput('body', 'Body');
    this.addDataInput('timeout', 'Timeout');

    // Add data outputs
    this.addDataOutput('response', 'Response');
    this.addDataOutput('status', 'Status');
    this.addDataOutput('error_data', 'Error Data');
  }

  async executeNode(
    inputs: {
      exec?: boolean;
      url?: string;
      method?: string;
      headers?: string;
      body?: string;
      timeout?: number;
    },
    context: NodeContext
  ): Promise<Record<string, any>> {
    try {
      // Get input values or use defaults from node data
      const url = inputs.url || this.data.url;
      const method = inputs.method || this.data.method;
      const headersStr = inputs.headers || this.data.headers;
      const body = inputs.body || this.data.body;
      const timeout = inputs.timeout || this.data.timeout;
      
      // Parse headers string to object
      let headersObj: Record<string, string> = {};
      try {
        headersObj = JSON.parse(headersStr);
      } catch (e) {
        this.warn(`Invalid headers JSON: ${headersStr}. Using empty headers.`);
      }
      
      this.info(`Making ${method} request to ${url}`);
      
      // In demo mode, simulate a response
      if (this.data.demoMode) {
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        // Simulate a response based on the URL
        if (url.includes('jsonplaceholder')) {
          return {
            response: { id: 1, title: 'Demo response', completed: false },
            status: 200,
            success: true
          };
        } else {
          return {
            response: { message: 'Demo response for ' + url },
            status: 200,
            success: true
          };
        }
      }
      
      // Make the actual request using NetworkUtil
      const options: RequestInit = {
        method,
        headers: headersObj,
        body: method !== 'GET' && body ? body : undefined,
      };
      
      const response = await fetch(url, options);
      const responseData = await response.json();
      
      return {
        response: responseData,
        status: response.status,
        success: true
      };
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.error(`HTTP Request failed: ${errorMessage}`);
      
      return {
        error_data: errorMessage,
        error: true
      };
    }
  }
}
