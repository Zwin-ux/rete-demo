import { ClassicPreset as Classic, type GetSchemes, NodeEditor } from 'rete';

import { type Area2D, AreaExtensions, AreaPlugin } from 'rete-area-plugin';
import {
  ConnectionPlugin,
  Presets as ConnectionPresets,
} from 'rete-connection-plugin';
import {
  ReactPlugin,
  type ReactArea2D,
  Presets as ReactPresets,
} from 'rete-react-plugin';
import { createRoot } from 'react-dom/client';

import { ScopesPlugin, Presets as ScopesPresets } from 'rete-scopes-plugin';

import {
  AutoArrangePlugin,
  Presets as ArrangePresets,
} from 'rete-auto-arrange-plugin';

const socket = new Classic.Socket('socket');

class Node extends Classic.Node {
  width = 180;
  height = 120;
  parent?: string;
}

class NodeA extends Node {
  constructor() {
    super('A');

    this.addControl('a', new Classic.InputControl('text', { initial: 'a' }));
    this.addOutput('port', new Classic.Output(socket));
  }
}

class NodeB extends Node {
  constructor() {
    super('B');

    this.addControl('b', new Classic.InputControl('text', { initial: 'b' }));
    this.addInput('port', new Classic.Input(socket));
  }
}

class NodeParent extends Node {
  constructor() {
    super('Parent');

    this.addInput('port', new Classic.Input(socket));
    this.addOutput('port', new Classic.Output(socket));
  }
}

class Connection<A extends Node, B extends Node> extends Classic.Connection<
  A,
  B
> {}

type Schemes = GetSchemes<Node, Connection<Node, Node>>;
type AreaExtra = Area2D<Schemes> | ReactArea2D<Schemes>;

export async function createEditor(container: HTMLElement) {
  const editor = new NodeEditor<Schemes>();
  const area = new AreaPlugin<Schemes, AreaExtra>(container);
  const connection = new ConnectionPlugin<Schemes, AreaExtra>();
  const reactRender = new ReactPlugin<Schemes, AreaExtra>({ createRoot });

  const scopes = new ScopesPlugin<Schemes>();

  AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
    accumulating: AreaExtensions.accumulateOnCtrl(),
  });

  reactRender.addPreset(ReactPresets.classic.setup());

  connection.addPreset(ConnectionPresets.classic.setup());

  scopes.addPreset(ScopesPresets.classic.setup());

  editor.use(area);

  area.use(connection);
  area.use(reactRender);

  area.use(scopes);

  const parent1 = new NodeParent();
  const b2 = new NodeB();
  const parent3 = new NodeParent();
  const a = new NodeA();
  const b = new NodeB();

  a.parent = parent1.id;
  b.parent = parent1.id;
  parent1.parent = parent3.id;
  b2.parent = parent3.id;

  await editor.addNode(parent3);
  await editor.addNode(parent1);
  await editor.addNode(b2);
  await editor.addNode(a);
  await editor.addNode(b);

  await editor.addConnection(new Classic.Connection(a, 'port', b, 'port'));
  await editor.addConnection(
    new Classic.Connection(parent1, 'port', b2, 'port')
  );

  const arrange = new AutoArrangePlugin<Schemes>();

  arrange.addPreset(ArrangePresets.classic.setup());

  area.use(arrange);

  await arrange.layout();

  return {
    destroy: () => area.destroy(),
  };
}
