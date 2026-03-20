import type {View} from '../View.js'
import type {Viewport} from '../Viewport.js'
import type {Screen} from '../Screen.js'
import type {Rect} from '../geometry.js'
import {Modal} from '../components/Modal.js'

interface ModalEntry {
  modal: Modal
  presentedRect: Rect
}

export class ModalManager {
  #stack: ModalEntry[] = []

  reset() {
    this.#stack = []
  }

  requestModal(modal: Modal, rect: Rect): boolean {
    this.#stack.push({modal, presentedRect: rect})
    return true
  }

  renderModals(screen: Screen, viewport: Viewport): View {
    let lastView: View = screen.rootView

    // Drain the stack: process entries one at a time.
    // screen.preRender() resets the modal manager (calls reset()), which
    // clears the stack. So we shift entries off one by one rather than
    // snapshotting, ensuring that nested modals pushed during render()
    // are appended to the stack and processed in subsequent iterations.
    while (this.#stack.length > 0) {
      const {modal, presentedRect} = this.#stack.shift()!

      modal.presentedRect = presentedRect
      modal.windowSize = viewport.contentSize

      // preRender resets managers (including this one via reset()).
      // Any modals already in the stack are lost — but we shifted ours
      // out first, and new modals pushed during render() go onto the
      // now-empty stack.
      screen.preRender(modal)
      lastView = modal

      modal.moveToScreen(screen)
      modal.naturalSize(viewport.contentSize)

      viewport.parentRect = presentedRect
      modal.render(viewport)
    }

    return lastView
  }
}
