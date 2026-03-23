import {
  ConsoleLog,
  Stack,
  KeyEvent,
  Size,
  View,
  Viewport,
  interceptConsoleLog,
} from '@teaui/core'

import {demo} from './demo.js'

interceptConsoleLog()

class Keys extends View {
  constructor() {
    super({})
  }

  naturalSize() {
    return Size.zero
  }

  receiveKey(event: KeyEvent) {
    console.info({event})
  }

  render(viewport: Viewport) {
    viewport.registerFocus({isDefault: true})
  }
}

class Mouse extends View {
  constructor() {
    super({})
  }

  naturalSize(available: Size) {
    return available
  }

  receiveKey(event: KeyEvent) {
    console.info({event})
  }

  render(viewport: Viewport) {
    viewport.registerMouse(['mouse.button.all'])
  }
}

demo(
  Stack.down([
    new Keys(),
    // new Mouse(),
    new ConsoleLog({flex: 1}),
  ]),
  false,
)
