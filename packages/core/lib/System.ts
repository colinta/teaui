import {View} from './View.js'
import {FocusManager} from './managers/FocusManager.js'

export class System {
  constructor(
    readonly view: View,
    readonly focusManager: FocusManager,
  ) {}

  requestFocus() {
    return this.focusManager.requestFocus(this.view)
  }
}

export class UnboundSystem {
  constructor(readonly focusManager: FocusManager) {}

  bind(view: View) {
    return new System(view, this.focusManager)
  }
}
