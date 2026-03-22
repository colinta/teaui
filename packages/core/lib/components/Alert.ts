import type {Viewport} from '../Viewport.js'
import {Size} from '../geometry.js'
import {type Props as NotificationProps, Notification} from './Notification.js'
import {Box} from './Box.js'
import {Modal, type Props as ModalProps} from './Modal.js'

export interface Props extends NotificationProps {}

export class Alert extends Notification {
  #box: Box

  static modal(props: Props & ModalProps): {alert: Alert; modal: Modal} {
    const {
      dim,
      dimStyle,
      dismissOnClick,
      dismissOnEsc,
      onDismiss,
      ...alertProps
    } = props
    const alert = new Alert(alertProps)
    const modal = new Modal({
      dim: dim ?? true,
      dimStyle,
      dismissOnEsc: dismissOnEsc ?? true,
      dismissOnClick: dismissOnClick ?? true,
      onDismiss,
      children: [alert],
    })
    return {alert, modal}
  }

  constructor(props: Props = {}) {
    super(props)

    this.#box = new Box({border: 'rounded', padding: 1})
    this.#box.add(this.contentStack)
    this.addDirect(this.#box)
  }

  update(props: Props) {
    super.update(props)
  }

  naturalSize(available: Size): Size {
    return this.#box.naturalSize(available)
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return
    }

    this.#box.render(viewport)
  }
}
