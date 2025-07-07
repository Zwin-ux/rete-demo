import { ClassicPreset } from 'rete';

// A custom control for a button
export class ButtonControl extends ClassicPreset.Control {
  constructor(public label: string, public onClick: () => void) {
    super();
  }
}

// A custom control for a checkbox
export class CheckboxControl extends ClassicPreset.Control {
  constructor(public initial: boolean, public change: (value: boolean) => void) {
    super();
  }
}
