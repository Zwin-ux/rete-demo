import { NodeEditor } from 'rete';
import { BaseNode } from '../core/BaseNode';
import { NodeInput } from '../types/node.types';

export class ConsoleLogNode extends BaseNode {
  private maxLogs: number = 10;
  private logs: Array<{ timestamp: string; message: string }> = [];

  constructor(editor: NodeEditor) {
    super(editor, 'console-log', 'Console Log');
  }

  getInputs(): NodeInput[] {
    return [
      { 
        name: 'input', 
        type: 'any', 
        description: 'Data to log',
        required: true
      },
    ];
  }

  getOutputs() {
    return [];
  }

  getControls() {
    return [
      {
        type: 'button',
        key: 'clear',
        label: 'Clear Logs',
        onClick: () => this.clearLogs(),
      },
      {
        type: 'number',
        key: 'maxLogs',
        label: 'Max Logs',
        min: 1,
        max: 100,
        value: this.maxLogs,
        onChange: (value: number) => {
          this.maxLogs = Math.min(100, Math.max(1, value));
          this.trimLogs();
          this.update();
        },
      },
    ];
  }

  private formatLogMessage(input: any): string {
    if (input === undefined) return 'undefined';
    if (input === null) return 'null';
    
    if (typeof input === 'string') {
      return input;
    }
    
    if (typeof input === 'object') {
      try {
        return JSON.stringify(input, null, 2);
      } catch (e) {
        return String(input);
      }
    }
    
    return String(input);
  }

  private addLog(message: string) {
    const timestamp = new Date().toISOString();
    this.logs.unshift({ timestamp, message });
    this.trimLogs();
    this.update();
  }

  private trimLogs() {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }

  public clearLogs() {
    this.logs = [];
    this.update();
  }

  protected async executeNode(
    inputs: Record<string, any>,
    context: any
  ): Promise<Record<string, any>> {
    const input = inputs.input;
    const formattedMessage = this.formatLogMessage(input);
    
    // Log to browser console
    console.log(`[${this.data.name}]`, input);
    
    // Add to node's log display
    this.addLog(formattedMessage);
    
    return {};
  }

  async onCreated() {
    super.onCreated();
    this.log('Console Log Node created');
  }

  async onDestroy() {
    this.log('Console Log Node destroyed');
    super.onDestroy();
  }

  // Method to get logs for UI rendering
  getLogs() {
    return [...this.logs];
  }
}
