import type {Viewport} from '../Viewport.js'
import {type Props as ContainerProps, Container} from '../Container.js'
import {Size} from '../geometry.js'
import {
  type KeyEvent,
  HotKey as HotKeyProp,
  toHotKeyDef,
} from '../events/index.js'

export interface Props extends ContainerProps {
  hotKey: HotKeyProp
  onPress?: (event: KeyEvent) => void
}

export class HotKey extends Container {
  #hotKey: HotKeyProp = {char: ''}
  #onPress?: (event: KeyEvent) => void

  constructor(props: Props) {
    super(props)

    this.#update(props)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({hotKey, onPress}: Props) {
    this.#hotKey = hotKey
    this.#onPress = onPress
  }

  naturalSize(): Size {
    return Size.zero
  }

  receiveKey(event: KeyEvent) {
    this.#onPress?.(event)
  }

  render(viewport: Viewport) {
    // Always register the hotkey — HotKey is non-visual (naturalSize is zero),
    // so the viewport will always be empty, but we still need to register.
    viewport.registerHotKey(toHotKeyDef(this.#hotKey))
  }
}
