import type {View} from '../View.js'
import {Container} from '../Container.js'
import type {Viewport} from '../Viewport.js'
import type {Screen} from '../Screen.js'
import type {Rect} from '../geometry.js'
import {type MouseEvent, isMouseClicked} from '../events/index.js'

export class ModalManager {
  #modalView = new Modal()
  #modal: [View, () => void, Rect] | undefined

  reset() {
    this.#modal = undefined
  }

  requestModal(
    parent: View,
    modal: View,
    onClose: () => void,
    rect: Rect,
  ): boolean {
    if (!this.#canRequestModal(parent)) {
      return false
    }

    if (this.#modal && this.#modal[0] !== modal) {
      this.#modal[1]()
    }

    this.#modal = [modal, onClose, rect]

    return true
  }

  renderModals(screen: Screen, viewport: Viewport) {
    this.#modalView.moveToScreen(screen)

    let lastView: View = screen.rootView
    // this.#modal can be assigned _another modal_
    while (this.#modal) {
      const [view, onClose, rect] = this.#modal

      // preRender calls reset() which assigns this.#modal = undefined
      screen.preRender(view)
      lastView = view

      this.#modalView.updateView(view, onClose)
      this.#modalView.naturalSize(viewport.contentSize)

      viewport.parentRect = rect
      this.#modalView.render(viewport)
    }

    return lastView
  }

  #canRequestModal(view: View): boolean {
    return this.#modal === undefined
  }
}

class Modal extends Container {
  #view: View | null = null
  #onClose: (() => void) | null = null

  updateView(view: View, onClose: () => void) {
    this.#onClose = onClose

    if (this.#view === view) {
      return
    }

    if (this.#view) {
      this.removeChild(this.#view)
    }
    this.add(view)
    this.#view = view
  }

  receiveMouse(event: MouseEvent) {
    if (isMouseClicked(event)) {
      this.#onClose?.()
    }
  }

  render(viewport: Viewport) {
    viewport.registerMouse('mouse.button.left')
    super.render(viewport)
  }
}
