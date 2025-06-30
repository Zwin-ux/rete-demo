import { AreaExtensions, AreaPlugin } from '@retejs/area-plugin';
import { ConnectionPlugin, Presets as ConnectionPresets } from '@retejs/connection-plugin';
import type { ReactArea2D } from '@retejs/react-plugin';
import { ReactPlugin, Presets as ReactPresets } from '@retejs/react-plugin';
import { AutoArrangePlugin, Presets as ArrangePresets } from '@retejs/auto-arrange-plugin';
import { createRoot } from 'react-dom/client';
import { TriggerNode, HttpRequestNode, ConditionNode, LogNode } from './workflow-nodes';
import { NodeEditor, type GetSchemes, ClassicPreset } from 'rete';
import * as React from 'react';

// Type definitions
type Node = TriggerNode | HttpRequestNode | ConditionNode | LogNode;
type Connection = ClassicPreset.Connection<Node, Node>;
type Schemes = GetSchemes<Node, Connection>;
type AreaExtra = ReactArea2D<Node, Connection>;

// React components for nodes
const ReactComponents = {
  TriggerNode: () => React.createElement(
    'div',
    { className: 'node trigger-node' },
    React.createElement('div', { className: 'node-title' }, 'Trigger'),
    React.createElement(
      'div',
      { className: 'node-output' },
      React.createElement('div', { className: 'socket', 'data-socket-type': 'output' }),
      React.createElement('span', null, 'Output')
    )
  ),
  
  HttpRequestNode: () => React.createElement(
    'div',
    { className: 'node http-node' },
    React.createElement('div', { className: 'node-title' }, 'HTTP Request'),
    React.createElement(
      'div',
      { className: 'node-input' },
      React.createElement('div', { className: 'socket', 'data-socket-type': 'input' }),
      React.createElement('span', null, 'Input')
    ),
    React.createElement(
      'div',
      { className: 'node-output' },
      React.createElement('div', { className: 'socket', 'data-socket-type': 'output' }),
      React.createElement('span', null, 'Output')
    )
  ),
  
  ConditionNode: () => React.createElement(
    'div',
    { className: 'node condition-node' },
    React.createElement('div', { className: 'node-title' }, 'Condition'),
    React.createElement(
      'div',
      { className: 'node-input' },
      React.createElement('div', { className: 'socket', 'data-socket-type': 'input' }),
      React.createElement('span', null, 'Input')
    ),
    React.createElement(
      'div',
      { className: 'node-outputs' },
      React.createElement(
        'div',
        { className: 'node-output' },
        React.createElement('div', { className: 'socket', 'data-socket-type': 'output' }),
        React.createElement('span', null, 'True')
      ),
      React.createElement(
        'div',
        { className: 'node-output' },
        React.createElement('div', { className: 'socket', 'data-socket-type': 'output' }),
        React.createElement('span', null, 'False')
      )
    )
  ),
  
  LogNode: () => React.createElement(
    'div',
    { className: 'node log-node' },
    React.createElement('div', { className: 'node-title' }, 'Log'),
    React.createElement(
      'div',
      { className: 'node-input' },
      React.createElement('div', { className: 'socket', 'data-socket-type': 'input' }),
      React.createElement('span', null, 'Input')
    )
  )
};

class Connection extends ClassicPreset.Connection<Node, Node> {
  constructor(source: Node, sourceOutput: string, target: Node, targetInput: string) {
    super(source, sourceOutput, target, targetInput);
  }
}

export async function createWorkflowEditor(container: HTMLElement) {
  const editor = new NodeEditor<Schemes>();
  const area = new AreaPlugin<Schemes, AreaExtra>(container);
  const connection = new ConnectionPlugin<Schemes, AreaExtra>();
  const render = new ReactPlugin<Schemes, AreaExtra>({ createRoot });
  const arrange = new AutoArrangePlugin<Schemes>();

  // Add plugins to the editor
  editor.use(area);
  area.use(connection);
  area.use(render);
  area.use(arrange);

  // Configure connection presets
  connection.addPreset(ConnectionPresets.classic.setup());

  // Configure render presets for nodes and connections
  render.addPreset(ReactPresets.classic.setup());
  render.addPreset(ReactPresets.contextMenu.setup());

  // Configure arrange plugin
  arrange.addPreset(ArrangePresets.classic.setup());

  // Add default nodes
  const triggerNode = new TriggerNode();
  const httpNode = new HttpRequestNode();
  const conditionNode = new ConditionNode();
  const logNode = new LogNode();

  // Position nodes
  triggerNode.position = { x: 100, y: 100 };
  httpNode.position = { x: 400, y: 100 };
  conditionNode.position = { x: 400, y: 300 };
  logNode.position = { x: 700, y: 100 };

  // Add nodes to the editor
  await editor.addNode(triggerNode);
  await editor.addNode(httpNode);
  await editor.addNode(conditionNode);
  await editor.addNode(logNode);

  // Set up node rendering
  render.addPreset({
    nodes: {
      TriggerNode: (props) => (
        <div className="node trigger-node">
          <div className="node-title">Trigger</div>
          <div className="node-output">
            <div className="socket" data-socket-type="output" />
            <span>Output</span>
          </div>
        </div>
      ),
      HttpRequestNode: (props) => (
        <div className="node http-node">
          <div className="node-title">HTTP Request</div>
          <div className="node-input">
            <div className="socket" data-socket-type="input" />
            <span>Input</span>
          </div>
          <div className="node-output">
            <div className="socket" data-socket-type="output" />
            <span>Output</span>
          </div>
        </div>
      ),
      ConditionNode: (props) => (
        <div className="node condition-node">
          <div className="node-title">Condition</div>
          <div className="node-input">
            <div className="socket" data-socket-type="input" />
            <span>Input</span>
          </div>
          <div className="node-outputs">
            <div className="node-output">
              <div className="socket" data-socket-type="output" />
              <span>True</span>
            </div>
            <div className="node-output">
              <div className="socket" data-socket-type="output" />
              <span>False</span>
            </div>
          </div>
        </div>
      ),
      LogNode: (props) => (
        <div className="node log-node">
          <div className="node-title">Log</div>
          <div className="node-input">
            <div className="socket" data-socket-type="input" />
            <span>Input</span>
          </div>
        </div>
      ),
    },
  });

  // Arrange nodes
  await arrange.layout();

  // Zoom to fit all nodes
  await area.zoomToFit({ padding: 100 });

  // Enable area features
  AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
    accumulating: AreaExtensions.accumulateOnCtrl(),
  });

  return {
    editor,
    area,
    connection,
    render,
    arrange,
  };
}

// Add React JSX types
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
