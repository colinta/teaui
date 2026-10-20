import type {Viewport} from '../Viewport.js'
import type {View} from '../View.js'
import {type Props as ContainerProps, Container} from '../Container.js'
import {Point, Rect, Size} from '../geometry.js'
import {Window, WINDOW_HOST, type WindowHost} from './Window.js'
import {
  type DesktopLayout,
  FloatingLayout,
  TiledLayout,
} from './DesktopLayout.js'

export type DesktopLayoutName = 'floating' | 'tiled'

export interface Props extends ContainerProps {
  /**
   * How windows are placed: 'floating' (default), 'tiled', or a custom
   * `DesktopLayout`. Layouts can hold state (e.g. the tiled ratio), so the
   * layout is only replaced when this prop changes.
   */
  layout?: DesktopLayoutName | DesktopLayout
}

/**
 * Manages `Window` children: their placement (via a `DesktopLayout` plugin),
 * z-order, and which window is active. Pressing on a window (or focusing a view
 * inside it) raises it to the top.
 *
 * Minimized windows are arranged by the Desktop, not the layout: they're lined
 * up along the bottom (one row each, in the order they were minimized), and
 * can't be moved or resized. The layout arranges the other windows in the
 * space above them.
 *
 * Children that aren't windows are drawn behind the windows, filling the
 * Desktop (a background, for instance).
 */
export class Desktop extends Container implements WindowHost {
  readonly [WINDOW_HOST] = true as const

  #layoutProp: DesktopLayoutName | DesktopLayout = DEFAULT_LAYOUT
  #layout: DesktopLayout = new FloatingLayout()
  // bottom to top
  #order: Window[] = []
  // in the order they were minimized
  #minimized: Window[] = []
  // the area available to the layout (above the minimized windows)
  #layoutSize = Size.zero
  // the window the layout was told is focused (see DesktopLayout.focus)
  #focused: Window | undefined

  constructor({child, children, ...props}: Props = {}) {
    super(props)
    this.#update(props)

    if (child) {
      this.add(child)
    } else if (children) {
      for (const child of children) {
        this.add(child)
      }
    }
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({layout}: Props) {
    this.layout = layout ?? DEFAULT_LAYOUT
  }

  get layout(): DesktopLayout {
    return this.#layout
  }
  set layout(value: DesktopLayoutName | DesktopLayout) {
    if (value === this.#layoutProp) {
      return
    }
    if (this.#focused) {
      this.#layout.blur?.(this.#focused, this)
      this.#focused = undefined
    }
    this.#layoutProp = value
    this.#layout = createLayout(value)
    this.invalidateSize()
  }

  /**
   * The windows, in z-order (bottom to top).
   */
  get windows(): readonly Window[] {
    return this.#order.filter(window => window.parent === this)
  }

  /**
   * The topmost visible window that isn't minimized.
   */
  get activeWindow(): Window | undefined {
    return this.windows.findLast(
      window => window.isVisible && !window.isMinimized,
    )
  }

  add(child: View, at?: number) {
    super.add(child, at)
    if (child instanceof Window && !this.#order.includes(child)) {
      this.#order.push(child)
    }
  }

  removeChild(child: View) {
    super.removeChild(child)
    if (child instanceof Window) {
      this.#order = this.#order.filter(window => window !== child)
    }
  }

  naturalSize(available: Size): Size {
    return available
  }

  render(viewport: Viewport) {
    if (!viewport.isProbe) {
      this.#updateFocused()
    }

    const windows = this.windows
    if (viewport.isEmpty) {
      super.render(viewport)
      return
    }

    for (const child of this.children) {
      if (!(child instanceof Window) && child.isVisible) {
        child.render(viewport)
      }
    }

    const size = viewport.contentSize
    const visible = this.children.filter(
      (child): child is Window => child instanceof Window && child.isVisible,
    )
    const frameMap = new Map<Window, Rect | undefined>()

    // minimized windows are arranged by the Desktop, along the bottom; the
    // layout arranges the rest, in the space above them.
    const minimizedHeight = this.#arrangeMinimized(visible, size, frameMap)
    this.#layoutSize = new Size(
      size.width,
      Math.max(0, size.height - minimizedHeight),
    )

    const tiled = visible.filter(window => !window.isMinimized)
    const frames = this.#layout.layout(tiled, this.#layoutSize)
    tiled.forEach((window, index) => frameMap.set(window, frames[index]))

    // windows are drawn in z-order, within their layer
    const layer = (window: Window) =>
      window.isMinimized ? 0 : (this.#layout.layer?.(window) ?? 0)
    const ordered = windows
      .filter(window => window.isVisible)
      .map((window, index) => ({window, index, layer: layer(window)}))
      .sort((a, b) => a.layer - b.layer || a.index - b.index)
    for (const {window} of ordered) {
      // windows without a frame still register their hotkeys and focus
      const frame = frameMap.get(window) ?? EMPTY_RECT
      viewport.clipped(frame, inside => window.render(inside))
    }
  }

  /**
   * Tells the layout when the active window changes (`DesktopLayout.focus` and
   * `blur`).
   */
  #updateFocused() {
    const active = this.activeWindow
    if (active === this.#focused) {
      return
    }

    const prev = this.#focused
    this.#focused = active
    if (prev) {
      this.#layout.blur?.(prev, this)
    }
    if (active) {
      this.#layout.focus?.(active, this)
    }
  }

  /**
   * Minimized windows are lined up along the bottom, one row tall, at the width
   * of their title bar, in the order they were minimized. Returns the height
   * they take up.
   */
  #arrangeMinimized(
    visible: Window[],
    size: Size,
    frames: Map<Window, Rect | undefined>,
  ): number {
    const minimized = this.#minimized.filter(
      window =>
        window.parent === this && window.isVisible && window.isMinimized,
    )
    for (const window of visible) {
      if (window.isMinimized && !minimized.includes(window)) {
        minimized.push(window)
      }
    }
    this.#minimized = minimized
    if (!minimized.length || size.isEmpty) {
      return 0
    }

    const rows: [Window, number][][] = [[]]
    let x = 0
    for (const window of minimized) {
      const width = Math.min(size.width, window.naturalTitleBarWidth)
      if (x > 0 && x + width > size.width) {
        rows.push([])
        x = 0
      }
      rows[rows.length - 1].push([window, width])
      x += width
    }

    const height = Math.min(size.height, rows.length * MINIMIZED_HEIGHT)
    rows.forEach((row, index) => {
      const y = size.height - height + index * MINIMIZED_HEIGHT
      let x = 0
      for (const [window, width] of row) {
        frames.set(
          window,
          y < 0 ? undefined : new Rect([x, y], [width, MINIMIZED_HEIGHT]),
        )
        x += width
      }
    })
    return height
  }

  // WindowHost

  activateWindow(window: Window) {
    if (this.#order.at(-1) === window || window.parent !== this) {
      return
    }

    this.#order = [...this.#order.filter(other => other !== window), window]
    this.invalidateRender()
  }

  isActiveWindow(window: Window): boolean {
    return this.activeWindow === window
  }

  canMoveWindow(window: Window): boolean {
    return !window.isMinimized && (this.#layout.canMove?.(window) ?? false)
  }

  canResizeWindow(window: Window): boolean {
    return !window.isMinimized && (this.#layout.canResize?.(window) ?? false)
  }

  moveWindow(window: Window, origin: Point) {
    if (window.isMinimized) {
      return
    }
    this.#layout.move?.(window, origin, this.#layoutSize)
    this.invalidateSize()
  }

  resizeWindow(window: Window, frame: Rect) {
    if (window.isMinimized) {
      return
    }
    this.#layout.resize?.(window, frame, this.#layoutSize)
    this.invalidateSize()
  }
}

function createLayout(
  layout: DesktopLayoutName | DesktopLayout,
): DesktopLayout {
  switch (layout) {
    case 'floating':
      return new FloatingLayout()
    case 'tiled':
      return new TiledLayout()
    default:
      return layout
  }
}

const DEFAULT_LAYOUT: DesktopLayoutName = 'floating'
const EMPTY_RECT = new Rect(Point.zero, Size.zero)
const MINIMIZED_HEIGHT = 1
