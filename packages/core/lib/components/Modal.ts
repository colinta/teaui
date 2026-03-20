import type {Viewport} from '../Viewport.js'
import {type Props as ContainerProps, Container} from '../Container.js'
import {Style} from '../Style.js'
import {Rect, Size} from '../geometry.js'
import {
  type MouseEvent,
  type KeyEvent,
  isMouseClicked,
  toHotKeyDef,
} from '../events/index.js'
import type {System} from '../System.js'

export interface Props extends ContainerProps {
  /**
   * If true, paints the entire screen with dimStyle before rendering children.
   * Default: false
   */
  dim?: boolean
  /**
   * Style used for dimming. Defaults to theme.dimTextColor fg + theme.dimBackgroundColor bg.
   */
  dimStyle?: Style
  /**
   * If true, clicking outside the modal content dismisses it.
   * Default: true
   */
  dismissOnClick?: boolean
  /**
   * If true, pressing Escape dismisses the modal.
   * Default: false
   */
  dismissOnEsc?: boolean
  /**
   * Called when the modal is dismissed (via click-outside or esc).
   */
  onDismiss?: () => void
}

/**
 * A modal overlay that is rendered above the main view tree.
 *
 * Pass a Modal instance to `viewport.requestModal(modal)` to present it.
 * The ModalManager sets `presentedRect` and `windowSize` before rendering.
 *
 * Usage:
 *   const modal = new Modal({
 *     dim: true,
 *     dismissOnClick: true,
 *     dismissOnEsc: true,
 *     onDismiss: () => { ... },
 *     children: [myContent],
 *   })
 *   viewport.requestModal(modal)
 */
export class Modal extends Container {
  #dim: boolean
  #dimStyle: Style | undefined
  #dismissOnClick: boolean
  #dismissOnEsc: boolean
  #onDismiss: (() => void) | undefined

  /**
   * The rect of the view that called `viewport.requestModal()`, in absolute
   * screen coordinates. Set by ModalManager before rendering.
   */
  presentedRect: Rect = Rect.zero

  /**
   * The full screen/window size. Set by ModalManager before rendering.
   */
  windowSize: Size = Size.zero

  constructor(props: Props = {}) {
    super(props)
    this.#dim = props.dim ?? false
    this.#dimStyle = props.dimStyle
    this.#dismissOnClick = props.dismissOnClick ?? true
    this.#dismissOnEsc = props.dismissOnEsc ?? false
    this.#onDismiss = props.onDismiss
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update(props: Props) {
    this.#dim = props.dim ?? false
    this.#dimStyle = props.dimStyle
    this.#dismissOnClick = props.dismissOnClick ?? true
    this.#dismissOnEsc = props.dismissOnEsc ?? false
    this.#onDismiss = props.onDismiss
  }

  get dim() {
    return this.#dim
  }

  set dim(value: boolean) {
    this.#dim = value
  }

  get dimStyle() {
    return this.#dimStyle
  }

  set dimStyle(value: Style | undefined) {
    this.#dimStyle = value
  }

  get dismissOnClick() {
    return this.#dismissOnClick
  }

  set dismissOnClick(value: boolean) {
    this.#dismissOnClick = value
  }

  get dismissOnEsc() {
    return this.#dismissOnEsc
  }

  set dismissOnEsc(value: boolean) {
    this.#dismissOnEsc = value
  }

  get onDismiss() {
    return this.#onDismiss
  }

  set onDismiss(value: (() => void) | undefined) {
    this.#onDismiss = value
  }

  receiveMouse(event: MouseEvent, system: System) {
    if (this.#dismissOnClick && isMouseClicked(event)) {
      this.#onDismiss?.()
    }
  }

  receiveKey(event: KeyEvent) {
    if (this.#dismissOnEsc && event.name === 'escape') {
      this.#onDismiss?.()
    }
  }

  render(viewport: Viewport) {
    if (this.#dim) {
      const style =
        this.#dimStyle ??
        new Style({
          foreground: this.theme.dimTextColor,
          background: this.theme.dimBackgroundColor,
        })
      viewport.paint(style)
    }

    if (this.#dismissOnClick) {
      viewport.registerMouse('mouse.button.left')
    }

    if (this.#dismissOnEsc) {
      viewport.registerHotKey(toHotKeyDef('escape'))
    }

    super.render(viewport)
  }
}
