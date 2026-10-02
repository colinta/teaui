import type {Viewport} from '../Viewport.js'
import {type Props as ContainerProps, Container} from '../Container.js'
import {Size} from '../geometry.js'
import {System} from '../System.js'
import type {MouseEvent, MouseEventListenerName} from '../events/index.js'

export interface Props extends ContainerProps {
  mouse?: MouseEventListenerName | MouseEventListenerName[]
  onMouse?: (event: MouseEvent, system: System) => void
}

/**
 * Adds fallback mouse handling to a region without changing its appearance.
 * Use it to handle events that the region's child controls do not handle;
 * children retain priority for events they handle at the same position.
 *
 * By default listens for all button, wheel, and movement events. Pass `mouse`
 * to restrict which events to listen for.
 */
export class Mouse extends Container {
  #mouse: MouseEventListenerName[]
  #onMouse?: (event: MouseEvent, system: System) => void

  constructor(props: Props) {
    super(props)

    this.#mouse = []
    this.#update(props)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({mouse, onMouse}: Props) {
    if (mouse === undefined) {
      this.#mouse = ['mouse.button.all', 'mouse.wheel', 'mouse.move']
    } else if (typeof mouse === 'string') {
      this.#mouse = [mouse]
    } else {
      this.#mouse = mouse
    }
    this.#onMouse = onMouse
  }

  naturalSize(available: Size): Size {
    return super.naturalSize(available)
  }

  receiveMouse(event: MouseEvent, system: System) {
    this.#onMouse?.(event, system)
  }

  render(viewport: Viewport) {
    viewport.registerMouse(this.#mouse)
    super.render(viewport)
  }
}
