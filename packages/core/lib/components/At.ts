import type {Viewport} from '../Viewport.js'
import {type Props as ViewProps, View} from '../View.js'
import {Container} from '../Container.js'
import {Rect, Point, Size} from '../geometry.js'
import type {Location} from './ZStack.js'

interface Props extends ViewProps {
  children?: View[]
  child?: View
  location?: Location
  useAvailable?: boolean
}

type ShorthandProps = NonNullable<Props['children']> | Omit<Props, 'location'>

function fromShorthand(
  props: ShorthandProps,
  location: Location,
  extraProps: Omit<Props, 'children' | 'location'> = {},
): Props {
  if (Array.isArray(props)) {
    return {children: props, location, ...extraProps}
  } else {
    return {...props, location, ...extraProps}
  }
}

/**
 * Positions its children at a fixed location within the available space.
 * Children are rendered as a ZStack (overlaid on top of each other), then
 * placed according to `location`.
 *
 * Designed for use inside a ZStack to anchor content at edges or corners.
 *
 * When `useAvailable` is true, the component uses the viewport's
 * `availableRect` instead of `contentRect` for sizing and placement.
 *
 * ```ts
 * new ZStack({
 *   children: [
 *     new Space({background: '#333'}),
 *     At.topRight([new Text({text: 'top-right'})]),
 *     At.bottomCenter([new Text({text: 'bottom'})]),
 *   ],
 * })
 * ```
 */
export class At extends Container {
  #location: Location
  #useAvailable: boolean

  static topLeft(
    props: ShorthandProps = {},
    extraProps: Omit<Props, 'children' | 'location'> = {},
  ): At {
    return new At(fromShorthand(props, 'top-left', extraProps))
  }

  static topCenter(
    props: ShorthandProps = {},
    extraProps: Omit<Props, 'children' | 'location'> = {},
  ): At {
    return new At(fromShorthand(props, 'top-center', extraProps))
  }

  static topRight(
    props: ShorthandProps = {},
    extraProps: Omit<Props, 'children' | 'location'> = {},
  ): At {
    return new At(fromShorthand(props, 'top-right', extraProps))
  }

  static left(
    props: ShorthandProps = {},
    extraProps: Omit<Props, 'children' | 'location'> = {},
  ): At {
    return new At(fromShorthand(props, 'left', extraProps))
  }

  static center(
    props: ShorthandProps = {},
    extraProps: Omit<Props, 'children' | 'location'> = {},
  ): At {
    return new At(fromShorthand(props, 'center', extraProps))
  }

  static right(
    props: ShorthandProps = {},
    extraProps: Omit<Props, 'children' | 'location'> = {},
  ): At {
    return new At(fromShorthand(props, 'right', extraProps))
  }

  static bottomLeft(
    props: ShorthandProps = {},
    extraProps: Omit<Props, 'children' | 'location'> = {},
  ): At {
    return new At(fromShorthand(props, 'bottom-left', extraProps))
  }

  static bottomCenter(
    props: ShorthandProps = {},
    extraProps: Omit<Props, 'children' | 'location'> = {},
  ): At {
    return new At(fromShorthand(props, 'bottom-center', extraProps))
  }

  static bottomRight(
    props: ShorthandProps = {},
    extraProps: Omit<Props, 'children' | 'location'> = {},
  ): At {
    return new At(fromShorthand(props, 'bottom-right', extraProps))
  }

  constructor({children, child, location, useAvailable, ...viewProps}: Props) {
    super(viewProps)

    this.#location = location ?? 'top-left'
    this.#useAvailable = useAvailable ?? false

    if (child) {
      this.add(child)
    }
    if (children) {
      for (const c of children) {
        this.add(c)
      }
    }
  }

  get location() {
    return this.#location
  }

  set location(value: Location) {
    if (value === this.#location) return
    this.#location = value
    this.invalidateSize()
  }

  get useAvailable() {
    return this.#useAvailable
  }

  set useAvailable(value: boolean) {
    if (value === this.#useAvailable) return
    this.#useAvailable = value
    this.invalidateSize()
  }

  update({children, child, location, useAvailable, ...props}: Props) {
    if (location !== undefined) {
      this.#location = location
    }
    if (useAvailable !== undefined) {
      this.#useAvailable = useAvailable
    }

    if (child !== undefined || children !== undefined) {
      this.removeAllChildren()
      if (children) {
        for (const c of children) {
          this.add(c)
        }
      }
      if (child) {
        this.add(child)
      }
    }

    super.update(props)
  }

  /**
   * The At component fills all available space — it's meant to be used
   * inside a ZStack layer.
   */
  naturalSize(available: Size): Size {
    return available
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return super.render(viewport)
    }

    const layoutRect = this.#useAvailable
      ? viewport.availableRect
      : viewport.contentRect

    // Compute combined children size (ZStack-style: max of all children)
    const childrenSize = Size.zero.mutableCopy()
    for (const child of this.children) {
      if (!child.isVisible) continue
      const childSize = child.naturalSize(layoutRect.size)
      childrenSize.width = Math.max(childrenSize.width, childSize.width)
      childrenSize.height = Math.max(childrenSize.height, childSize.height)
    }

    const origin = computeOrigin(this.#location, layoutRect.size, childrenSize)

    // Offset by layoutRect origin (relevant when using availableRect, which
    // may have negative origin)
    const drawOrigin = new Point(
      origin.x + layoutRect.origin.x,
      origin.y + layoutRect.origin.y,
    )

    const drawRect = new Rect(drawOrigin, childrenSize)

    // Render all children overlaid (ZStack-style) at the computed position
    viewport.clipped(drawRect, inside => {
      for (const child of this.children) {
        if (!child.isVisible) continue
        child.render(inside)
      }
    })
  }
}

function computeOrigin(
  location: Location,
  available: Size,
  childSize: Size,
): Point {
  let x: number, y: number

  // horizontal
  if (
    location === 'top-left' ||
    location === 'left' ||
    location === 'bottom-left'
  ) {
    x = 0
  } else if (
    location === 'top-center' ||
    location === 'center' ||
    location === 'bottom-center'
  ) {
    x = Math.round((available.width - childSize.width) / 2)
  } else {
    x = available.width - childSize.width
  }

  // vertical
  if (
    location === 'top-left' ||
    location === 'top-center' ||
    location === 'top-right'
  ) {
    y = 0
  } else if (
    location === 'left' ||
    location === 'center' ||
    location === 'right'
  ) {
    y = Math.round((available.height - childSize.height) / 2)
  } else {
    y = available.height - childSize.height
  }

  return new Point(Math.max(0, x), Math.max(0, y))
}
