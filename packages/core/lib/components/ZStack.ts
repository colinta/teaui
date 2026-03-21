import type {Viewport} from '../Viewport.js'
import {type Props as ViewProps} from '../View.js'
import {Container} from '../Container.js'
import {Rect, Point, Size} from '../geometry.js'

export type Location =
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
  location?: Location
  children?: import('../View.js').View[]
  child?: import('../View.js').View
}

/**
 * Overlays children on top of each other. Each child receives the full
 * available size. Children are rendered in order, so later children appear
 * above earlier ones.
 *
 * When `align` is set, each child is positioned at the specified alignment
 * within the available space, and the ZStack takes up all available space.
 */
export class ZStack extends Container {
  #location: Location | undefined

  constructor(props: Props = {}) {
    super(props)
    this.#update(props)
  }

  get align() {
    return this.#location
  }
  set align(value: Location | undefined) {
    if (value === this.#location) return
    this.#location = value
    this.invalidateSize()
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({location: align}: Props) {
    this.#location = align
  }

  naturalSize(available: Size): Size {
    if (this.#location !== undefined) {
      return available
    }

    const size = Size.zero.mutableCopy()
    for (const child of this.children) {
      if (!child.isVisible) continue
      const childSize = child.naturalSize(available)
      size.width = Math.max(size.width, childSize.width)
      size.height = Math.max(size.height, childSize.height)
    }
    return size
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return super.render(viewport)
    }

    if (this.#location !== undefined) {
      for (const child of this.children) {
        if (!child.isVisible) continue

        const childSize = child.naturalSize(viewport.contentSize)
        const origin = computeOrigin(
          this.#location,
          viewport.contentSize,
          childSize,
        )
        viewport.clipped(new Rect(origin, childSize), inside => {
          child.render(inside)
        })
      }
    } else {
      for (const child of this.children) {
        if (!child.isVisible) continue
        child.render(viewport)
      }
    }
  }
}

function computeOrigin(
  align: Location,
  available: Size,
  childSize: Size,
): Point {
  let x: number, y: number

  // horizontal
  if (align === 'top-left' || align === 'left' || align === 'bottom-left') {
    x = 0
  } else if (
    align === 'top-center' ||
    align === 'center' ||
    align === 'bottom-center'
  ) {
    x = Math.round((available.width - childSize.width) / 2)
  } else {
    x = available.width - childSize.width
  }

  // vertical
  if (align === 'top-left' || align === 'top-center' || align === 'top-right') {
    y = 0
  } else if (align === 'left' || align === 'center' || align === 'right') {
    y = Math.round((available.height - childSize.height) / 2)
  } else {
    y = available.height - childSize.height
  }

  return new Point(Math.max(0, x), Math.max(0, y))
}
