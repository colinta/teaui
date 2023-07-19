import type {Mutable} from './geometry'
import type {Viewport} from './Viewport'
import type {Screen} from './Screen'
import {Theme} from './Theme'
import type {KeyEvent, MouseEvent} from './events'
import {Point, Size, Rect} from './geometry'

export interface Props {
  theme?: Theme
  x?: number
  y?: number
  //
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  //
  padding?: number | Partial<Edges>
}

interface Edges {
  top: number
  right: number
  bottom: number
  left: number
}

export abstract class View {
  parent: View | null = null
  #screen: Screen | null = null
  #theme: Theme | undefined

  #x: Props['x']
  #y: Props['y']
  #width: Props['width']
  #height: Props['height']
  #minWidth: Props['minWidth']
  #minHeight: Props['minHeight']
  #maxWidth: Props['maxWidth']
  #maxHeight: Props['maxHeight']
  #padding: Edges | undefined

  constructor({
    theme,
    x,
    y,
    width,
    height,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    padding,
  }: Props = {}) {
    this.#theme = theme
    this.#x = x
    this.#y = y
    this.#width = width
    this.#height = height
    this.#minWidth = minWidth
    this.#minHeight = minHeight
    this.#maxWidth = maxWidth
    this.#maxHeight = maxHeight

    this.#padding = toEdges(padding)

    const render = this.render.bind(this)
    this.render = this.#renderWrap(render).bind(this)
    const intrinsicSize = this.intrinsicSize.bind(this)
    this.intrinsicSize = this.#intrinsicSizeWrap(intrinsicSize).bind(this)

    Object.defineProperties(this, {
      render: {
        enumerable: false,
      },
      intrinsicSize: {
        enumerable: false,
      },
      parent: {
        enumerable: false,
      },
    })
  }

  get theme(): Theme {
    return this.#theme ?? this.parent?.theme ?? Theme.default
  }

  get screen(): Screen | null {
    return this.#screen
  }

  #restrictSize(availableSize: () => Size): Mutable<Size> {
    if (this.#width !== undefined && this.#height !== undefined) {
      return new Size(this.#width, this.#height).mutableCopy()
    }

    const size = availableSize().mutableCopy()

    if (this.#width !== undefined) {
      size.width = this.#width
    } else {
      if (this.#minWidth !== undefined) {
        size.width = Math.max(this.#minWidth, size.width)
      }
      if (this.#maxWidth !== undefined) {
        size.width = Math.min(this.#maxWidth, size.width)
      }
    }

    if (this.#height !== undefined) {
      size.height = this.#height
    } else {
      if (this.#minHeight !== undefined) {
        size.height = Math.max(this.#minHeight, size.height)
      }
      if (this.#maxHeight !== undefined) {
        size.height = Math.min(this.#maxHeight, size.height)
      }
    }

    return size
  }

  #intrinsicSizeWrap(
    intrinsicSize: (availableSize: Size) => Mutable<Size>,
  ): (availableSize: Size) => Mutable<Size> {
    return availableSize => {
      if (this.#x || this.#y) {
        availableSize = availableSize.shrink(this.#x ?? 0, this.#y ?? 0)
      }

      const size = this.#restrictSize(() => {
        let contentSize = intrinsicSize(availableSize)
        if (this.#padding) {
          contentSize = contentSize.grow(
            this.#padding.left + this.#padding.right,
            this.#padding.top + this.#padding.bottom,
          )
        }
        return contentSize
      })

      if (this.#x) {
        size.width += this.#x
      }
      if (this.#y) {
        size.height += this.#y
      }

      return size
    }
  }

  #renderWrap(
    render: (viewport: Viewport) => void,
  ): (viewport: Viewport) => void {
    return viewport => {
      let origin: Point
      let contentSize: Size = viewport.contentSize
      if (this.#x || this.#y) {
        origin = new Point(this.#x ?? 0, this.#y ?? 0)
        contentSize = contentSize.shrink(origin.x, origin.y)
      } else {
        origin = Point.zero
      }

      contentSize = this.#restrictSize(() => contentSize)

      if (this.#padding) {
        origin = origin.offset(this.#padding.left, this.#padding.top)
        contentSize = contentSize.shrink(
          this.#padding.left + this.#padding.right,
          this.#padding.top + this.#padding.bottom,
        )
      }

      const rect = new Rect(origin, contentSize)
      viewport._render(this, rect, render)
    }
  }

  abstract intrinsicSize(availableSize: Size): Size
  abstract render(viewport: Viewport): void

  receiveKey(event: KeyEvent) {}
  receiveMouse(event: MouseEvent) {}
  receiveTick(dt: number): boolean | undefined {
    return
  }

  willMoveTo(parent: View) {}
  didMoveFrom(parent: View) {}
  didMount(screen: Screen) {}
  didUnmount(screen: Screen) {}

  moveToScreen(screen: Screen | null) {
    if (this.#screen !== screen) {
      const prev = this.#screen
      this.#screen = screen

      if (screen) {
        if (prev) {
          this.didUnmount(prev)
        }
        this.didMount(screen)
      } else {
        this.didUnmount(prev!)
      }
    }
  }
}

function toEdges(
  edges: number | Partial<Edges> | undefined,
): Edges | undefined {
  if (!edges) {
    return
  }

  if (typeof edges === 'number') {
    return {
      top: edges,
      right: edges,
      bottom: edges,
      left: edges,
    }
  }

  return {
    top: edges.top ?? 0,
    right: edges.right ?? 0,
    bottom: edges.bottom ?? 0,
    left: edges.left ?? 0,
  }
}
