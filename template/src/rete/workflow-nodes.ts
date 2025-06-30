import { ClassicPreset } from 'rete';

const socket = new ClassicPreset.Socket('socket');

interface Position {
  x: number;
  y: number;
}

export class TriggerNode extends ClassicPreset.Node<{}, { output: ClassicPreset.Socket }> {
  width = 180;
  height = 120;
  position: Position = { x: 0, y: 0 };

  constructor() {
    super('Trigger');
    this.addOutput('output', new ClassicPreset.Output(socket, 'Output'));
  }
}

export class HttpRequestNode extends ClassicPreset.Node<{ input: ClassicPreset.Socket }, { output: ClassicPreset.Socket }> {
  width = 200;
  height = 180;
  position: Position = { x: 0, y: 0 };

  constructor() {
    super('HTTP Request');
    this.addInput('input', new ClassicPreset.Input(socket, 'Input'));
    this.addOutput('output', new ClassicPreset.Output(socket, 'Output'));
    
    this.addControl(
      'method',
      new ClassicPreset.InputControl('select', {
        initial: 'GET',
        items: ['GET', 'POST', 'PUT', 'DELETE']
      }) as any
    );
    
    this.addControl(
      'url',
      new ClassicPreset.InputControl('text', {
        initial: 'https://api.example.com'
      }) as any
    );
  }
}

export class ConditionNode extends ClassicPreset.Node<{ input: ClassicPreset.Socket }, { true: ClassicPreset.Socket, false: ClassicPreset.Socket }> {
  width = 200;
  height = 200;
  position: Position = { x: 0, y: 0 };

  constructor() {
    super('Condition');
    this.addInput('input', new ClassicPreset.Input(socket, 'Input'));
    this.addOutput('true', new ClassicPreset.Output(socket, 'True'));
    this.addOutput('false', new ClassicPreset.Output(socket, 'False'));
    
    this.addControl(
      'operator',
      new ClassicPreset.InputControl('select', {
        initial: '==',
        items: ['==', '!=', '>', '<', '>=', '<=']
      }) as any
    );
    
    this.addControl(
      'value',
      new ClassicPreset.InputControl('text', {
        initial: 'value'
      }) as any
    );
  }
}

export class LogNode extends ClassicPreset.Node<{ input: ClassicPreset.Socket }, {}> {
  width = 180;
  height = 140;
  position: Position = { x: 0, y: 0 };

  constructor() {
    super('Log');
    this.addInput('input', new ClassicPreset.Input(socket, 'Input'));
    
    this.addControl(
      'message',
      new ClassicPreset.InputControl('text', {
        initial: 'Log message',
        change: () => {}
      }) as any
    );
  }
}
