import type {Viewport} from '../Viewport.js'
import {type Props as ContainerProps, Container} from '../Container.js'
import {Size} from '../geometry.js'
import type {KeyEvent} from '../events/index.js'

export interface Props extends ContainerProps {
  onKey?: (event: KeyEvent) => void
}

/**
 * A non-visual, non-focusable container that receives key events as a fallback —
 * only when no hotkey matches and no child view has focus. If multiple Keyboard
 * views are nested, the innermost one receives the event.
 */
export class Keyboard extends Container {
  #onKey?: (event: KeyEvent) => void

  constructor(props: Props) {
    super(props)

    this.#update(props)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({onKey}: Props) {
    this.#onKey = onKey
  }

  naturalSize(available: Size): Size {
    return super.naturalSize(available)
  }

  receiveKey(event: KeyEvent) {
    this.#onKey?.(event)
  }

  render(viewport: Viewport) {
    viewport.registerKeyboard()
    super.render(viewport)
  }
}
