import type {Viewport} from '../Viewport.js'
import {type Props as ViewProps, View} from '../View.js'
import {Size} from '../geometry.js'
import {
  type KeyEvent,
  HotKey as HotKeyProp,
  toHotKeyDef,
} from '../events/index.js'

export interface Props extends ViewProps {
  hotKey: HotKeyProp
  label?: string
  onPress?: (event: KeyEvent) => void
}

export class HotKey extends View {
  #hotKey: HotKeyProp = {char: ''}
  #label?: string
  #onPress?: (event: KeyEvent) => void

  constructor(props: Props) {
    super(props)

    this.#update(props)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({hotKey, label, onPress}: Props) {
    this.#hotKey = hotKey
    this.#label = label
    this.#onPress = onPress
  }

  get hotKey(): HotKeyProp {
    return this.#hotKey
  }

  get label(): string | undefined {
    return this.#label
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
