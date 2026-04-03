import type {Viewport} from '../Viewport.js'
import type {Container} from '../Container.js'
import type {View} from '../View.js'
import {Point, Rect, Size} from '../geometry.js'
import {type Props as NotificationProps, Notification} from './Notification.js'
import {Box} from './Box.js'
import {Modal} from './Modal.js'
import {Container as BaseContainer} from '../Container.js'

export interface Props extends NotificationProps {
  /**
   * When true, the alert is presented as a modal overlay.
   * Default: false
   */
  visible?: boolean
  /**
   * If true, paints the entire screen with dimStyle before rendering.
   * Default: true
   */
  dim?: boolean
  /**
   * If true, pressing Escape dismisses the alert.
   * Default: true
   */
  dismissOnEsc?: boolean
  /**
   * If true, clicking outside the alert dismisses it.
   * Default: true
   */
  dismissOnClick?: boolean
  /**
   * Called when the alert is dismissed (via click-outside, esc, or dismiss()).
   */
  onDismiss?: () => void
}

/**
 * Centers its child, constraining the available width to max(MIN_WIDTH, available / 3).
 */
class AlertLayout extends BaseContainer {
  naturalSize(available: Size): Size {
    return available
  }

  render(viewport: Viewport) {
    const child = this.children[0]
    if (!child || viewport.isEmpty) {
      return
    }

    const screenWidth = viewport.contentSize.width
    const preferredWidth = Math.max(
      MIN_ALERT_WIDTH,
      Math.floor(screenWidth / 3),
    )
    // First pass: compute natural size at preferred width
    const naturalSize = child.naturalSize(
      new Size(preferredWidth, viewport.contentSize.height),
    )
    // Use the wider of preferred and natural, capped at screen width
    const finalWidth = Math.min(
      Math.max(preferredWidth, naturalSize.width),
      screenWidth,
    )
    const childSize = child.naturalSize(
      new Size(finalWidth, viewport.contentSize.height),
    )
    const x = Math.max(
      0,
      Math.floor((viewport.contentSize.width - childSize.width) / 2),
    )
    const y = Math.max(
      0,
      Math.floor((viewport.contentSize.height - childSize.height) / 2),
    )
    viewport.clipped(new Rect(new Point(x, y), childSize), inside => {
      child.render(inside)
    })
  }
}

/**
 * A notification meant to be presented in a modal overlay, drawn in a
 * rounded-corner Box.
 *
 * Call `alert.presentFrom(owner)` to add the alert to a container and present
 * it as a modal. The alert renders as zero-size in the layout; when visible,
 * it presents a Modal overlay during `render()`.
 *
 * If the owner is removed from the tree, the alert is automatically removed
 * too — no modal will be presented.
 *
 * Usage (core):
 *   const alert = new Alert({
 *     title: 'Confirm Delete',
 *     purpose: 'cancel',
 *     dismissOnEsc: true,
 *     onDismiss() { console.info('dismissed') },
 *     children: [
 *       new Text({text: 'Are you sure?'}),
 *       new Button({title: 'Cancel', onClick() { alert.dismiss() }}),
 *     ],
 *   })
 *
 *   new Button({
 *     title: 'Delete',
 *     onClick() { alert.presentFrom(layout) },
 *   })
 */
export class Alert extends Notification {
  #box: Box
  #centerLayout: AlertLayout
  #modal: Modal
  #visible: boolean
  #owner: Container | undefined
  #onDismiss: (() => void) | undefined

  constructor(props: Props = {}) {
    super(props)

    this.#visible = props.visible ?? false
    this.#onDismiss = props.onDismiss

    this.#box = new Box({border: 'rounded', padding: 1})
    this.#box.add(this.contentStack)

    this.#centerLayout = new AlertLayout({children: [this.#box]})

    this.#modal = new Modal({
      dim: props.dim ?? true,
      dismissOnEsc: props.dismissOnEsc ?? true,
      dismissOnClick: props.dismissOnClick ?? true,
      onDismiss: () => {
        this.dismiss()
      },
      children: [this.#centerLayout],
    })
  }

  update(props: Props) {
    this.#onDismiss = props.onDismiss
    this.#visible = props.visible ?? false
    this.#modal.dim = props.dim ?? true
    this.#modal.dismissOnEsc = props.dismissOnEsc ?? true
    this.#modal.dismissOnClick = props.dismissOnClick ?? true
    super.update(props)
  }

  get visible(): boolean {
    return this.#visible
  }

  set visible(value: boolean) {
    if (value === this.#visible) {
      return
    }
    this.#visible = value
    this.invalidateSize()
  }

  /**
   * Present this alert as a modal, adding it to the given owner container.
   * The alert is removed from the owner when dismissed.
   */
  presentFrom(owner: Container) {
    this.#owner = owner
    owner.add(this)
    this.visible = true
  }

  /**
   * Dismiss this alert, removing it from its owner container.
   */
  dismiss() {
    this.#visible = false
    if (this.#owner) {
      this.#owner.removeChild(this)
      this.#owner.invalidateRender()
      this.#owner = undefined
    }
    this.#onDismiss?.()
  }

  naturalSize(_available: Size): Size {
    return Size.zero
  }

  render(viewport: Viewport) {
    if (this.#visible) {
      viewport.requestModal(this.#modal)
    }
  }
}

const MIN_ALERT_WIDTH = 40
