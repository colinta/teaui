import {View, type Props as ViewProps} from '../../lib/View.js'
import type {Viewport} from '../../lib/Viewport.js'
import {Size, type Rect} from '../../lib/geometry.js'
import {
  toHotKeyDef,
  type HotKey,
  type KeyEvent,
  type MouseEvent,
  type MouseEventListenerName,
} from '../../lib/events/index.js'

export interface ProbeConfig {
  /** `viewport.registerMouse()` events */
  mouse?: MouseEventListenerName[]
  /** Restricts the `viewport.registerMouse()` to a region */
  mouseRect?: Rect
  /** Register the mouse inside a clipped child viewport at this rect */
  mouseClipped?: Rect
  /** `viewport.registerFocus()` */
  focus?: boolean | {isDefault: boolean}
  /** `viewport.registerHotKey()` */
  hotKeys?: HotKey[]
  /** `viewport.registerKeyboard()` */
  keyboard?: boolean
  size?: Size
}

/**
 * A view that registers for exactly what it's configured to, and logs what it
 * receives. It intentionally *never calls super* in `receiveMouse`, `receiveKey`,
 * `didFocus` or `didBlur`.
 */
export class Probe extends View {
  mouse: MouseEvent[] = []
  keys: KeyEvent[] = []
  focusLog: ('didFocus' | 'didBlur')[] = []
  renders = 0

  constructor(
    readonly config: ProbeConfig = {},
    props: ViewProps = {},
  ) {
    super(props)
  }

  naturalSize(available: Size): Size {
    return this.config.size ?? available
  }

  receiveMouse(event: MouseEvent) {
    this.mouse.push(event)
  }

  receiveKey(event: KeyEvent) {
    this.keys.push(event)
  }

  didFocus() {
    this.focusLog.push('didFocus')
  }

  didBlur() {
    this.focusLog.push('didBlur')
  }

  get mouseNames() {
    return this.mouse.map(event => event.name)
  }

  render(viewport: Viewport) {
    this.renders += 1
    const {config} = this
    if (config.focus) {
      viewport.registerFocus({
        isDefault: config.focus === true ? true : config.focus.isDefault,
      })
    }
    for (const hotKey of config.hotKeys ?? []) {
      viewport.registerHotKey(toHotKeyDef(hotKey))
    }
    if (config.keyboard) {
      viewport.registerKeyboard()
    }
    if (viewport.isEmpty) {
      return
    }
    if (config.mouse) {
      viewport.registerMouse(config.mouse, config.mouseRect)
    }
    if (config.mouseClipped && config.mouse) {
      const mouse = config.mouse
      viewport.clipped(config.mouseClipped, inner => {
        inner.registerMouse(mouse)
      })
    }
  }
}
