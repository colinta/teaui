import type {Viewport} from '../Viewport.js'
import {type Props as ViewProps} from '../View.js'
import {Container} from '../Container.js'
import {Rect, Point, Size} from '../geometry.js'

export type PinLocation =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'left'
  | 'center'
  | 'right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

interface Props extends ViewProps {
  location?: PinLocation
  children?: import('../View.js').View[]
  child?: import('../View.js').View
}

/**
 * Positions its children at a specific location within the available space.
 * Takes up all available space (like a flex container) and places children
 * at the specified grid position.
 */
export class Pin extends Container {
  #location: PinLocation = 'top-left'

  constructor(props: Props = {}) {
    super(props)
    this.#update(props)
  }

  get location() {
    return this.#location
  }
  set location(value: PinLocation) {
    if (value === this.#location) return
    this.#location = value
    this.invalidateSize()
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({location}: Props) {
    this.#location = location ?? 'top-left'
  }

  naturalSize(available: Size): Size {
    return available
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return super.render(viewport)
    }

    for (const child of this.children) {
      if (!child.isVisible) continue

      const childSize = child.naturalSize(viewport.contentSize)
      const origin = this.#computeOrigin(viewport.contentSize, childSize)
      viewport.clipped(new Rect(origin, childSize), inside => {
        child.render(inside)
      })
    }
  }

  #computeOrigin(available: Size, childSize: Size): Point {
    let x: number, y: number

    // horizontal
    if (
      this.#location === 'top-left' ||
      this.#location === 'left' ||
      this.#location === 'bottom-left'
    ) {
      x = 0
    } else if (
      this.#location === 'top-center' ||
      this.#location === 'center' ||
      this.#location === 'bottom-center'
    ) {
      x = Math.round((available.width - childSize.width) / 2)
    } else {
      x = available.width - childSize.width
    }

    // vertical
    if (
      this.#location === 'top-left' ||
      this.#location === 'top-center' ||
      this.#location === 'top-right'
    ) {
      y = 0
    } else if (
      this.#location === 'left' ||
      this.#location === 'center' ||
      this.#location === 'right'
    ) {
      y = Math.round((available.height - childSize.height) / 2)
    } else {
      y = available.height - childSize.height
    }

    return new Point(Math.max(0, x), Math.max(0, y))
  }
}
