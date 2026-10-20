import {Point, Rect, Size} from '../geometry.js'
import type {Window} from './Window.js'

/**
 * Decides where a `Desktop` places its windows. A layout is a plugin: write your
 * own to implement other window-management styles.
 *
 * `layout()` is called on every render, and must return one frame per window
 * (or `undefined` to hide that window). The Desktop draws the windows in
 * z-order, so overlapping frames are fine.
 *
 * The optional methods handle the user dragging a window's title bar (`move`)
 * or its borders (`resize`). Without `canMove`/`canResize` (or if they return
 * false), windows can't be moved or resized.
 */
export interface DesktopLayout {
  /**
   * @param windows The visible windows that aren't minimized, in the order
   *   they were added to the Desktop (not z-order). Minimized windows are
   *   arranged by the Desktop.
   * @param size The area available to the windows: the size of the Desktop,
   *   less the rows used by minimized windows.
   */
  layout(windows: readonly Window[], size: Size): (Rect | undefined)[]
  canMove?(window: Window): boolean
  canResize?(window: Window): boolean
  /**
   * The user dragged the title bar; `origin` is the requested location.
   */
  move?(window: Window, origin: Point, size: Size): void
  /**
   * The user dragged a border; `frame` is the requested frame (already
   * restricted to the window's minimum and maximum size).
   */
  resize?(window: Window, frame: Rect, size: Size): void
}

/**
 * Traditional overlapping windows. Each window keeps its own `position` and
 * size; windows without a position are cascaded from the top-left. Maximized
 * windows fill the Desktop.
 */
export class FloatingLayout implements DesktopLayout {
  #cascade = 0

  layout(windows: readonly Window[], size: Size): Rect[] {
    return windows.map(window => {
      if (window.isMaximized) {
        return new Rect(Point.zero, size)
      }

      const windowSize = window.naturalSize(size).max(size)
      let position = window.position
      if (!position) {
        position = this.#nextCascade(windowSize, size)
        window.position = position
      }

      return new Rect(clampOrigin(position, windowSize, size), windowSize)
    })
  }

  canMove() {
    return true
  }

  canResize() {
    return true
  }

  move(window: Window, origin: Point, size: Size) {
    const windowSize = window.naturalSize(size).max(size)
    window.position = clampOrigin(origin, windowSize, size)
  }

  resize(window: Window, frame: Rect, size: Size) {
    let x = frame.origin.x
    let y = frame.origin.y
    let width = frame.size.width
    let height = frame.size.height
    if (x < 0) {
      width += x
      x = 0
    }
    if (y < 0) {
      height += y
      y = 0
    }
    width = Math.min(width, size.width - x)
    height = Math.min(height, size.height - y)

    window.position = new Point(x, y)
    window.width = width
    window.height = height
  }

  #nextCascade(windowSize: Size, size: Size): Point {
    const index = this.#cascade++
    const maxX = Math.max(1, size.width - windowSize.width + 1)
    const maxY = Math.max(1, size.height - windowSize.height + 1)
    return new Point(
      (index * CASCADE_STEP_X) % maxX,
      (index * CASCADE_STEP_Y) % maxY,
    )
  }
}

export interface TiledLayoutOptions {
  /**
   * The width of the main (first) window, as a fraction of the Desktop width.
   * Default: 0.5
   */
  ratio?: number
}

/**
 * Tiling window management: the first window fills the left side, the other
 * windows are stacked on the right. Drag the border between the two sides to
 * change the ratio. Windows can't be moved, and a maximized window covers the
 * tiles.
 */
export class TiledLayout implements DesktopLayout {
  ratio: number
  #main: Window | undefined
  #stack: Window[] = []

  constructor({ratio}: TiledLayoutOptions = {}) {
    this.ratio = clampRatio(ratio ?? DEFAULT_RATIO)
  }

  layout(windows: readonly Window[], size: Size): (Rect | undefined)[] {
    const frames = new Map<Window, Rect>()
    for (const window of windows) {
      if (window.isMaximized) {
        frames.set(window, new Rect(Point.zero, size))
      }
    }

    const tiles = windows.filter(window => !window.isMaximized)
    this.#main = tiles[0]
    this.#stack = tiles.slice(1)
    if (this.#main) {
      const mainWidth = this.#stack.length
        ? this.#mainWidth(size.width * this.ratio, size.width)
        : size.width
      frames.set(this.#main, new Rect(Point.zero, [mainWidth, size.height]))

      const stackWidth = size.width - mainWidth
      let y = 0
      this.#stack.forEach((window, index) => {
        const remaining = this.#stack.length - index
        const height = Math.round((size.height - y) / remaining)
        frames.set(window, new Rect([mainWidth, y], [stackWidth, height]))
        y += height
      })
    }

    return windows.map(window => frames.get(window))
  }

  canMove() {
    return false
  }

  canResize(window: Window) {
    return this.#stack.length > 0 && !window.isMaximized
  }

  resize(window: Window, frame: Rect, size: Size) {
    if (size.width <= 0) {
      return
    }

    let mainWidth: number
    if (window === this.#main) {
      mainWidth = frame.size.width
    } else if (this.#stack.includes(window)) {
      mainWidth = frame.origin.x
    } else {
      return
    }
    this.ratio = clampRatio(this.#mainWidth(mainWidth, size.width) / size.width)
  }

  /**
   * Restricts the width of the main window so that the main and stacked
   * windows keep their minimum widths (when there's room for both).
   */
  #mainWidth(width: number, totalWidth: number): number {
    const mainMinimum = this.#main?.minimumSize.width ?? 0
    const stackMinimum = Math.max(
      0,
      ...this.#stack.map(window => window.minimumSize.width),
    )
    width = Math.round(width)
    if (mainMinimum + stackMinimum > totalWidth) {
      return width
    }
    return Math.max(mainMinimum, Math.min(totalWidth - stackMinimum, width))
  }
}

function clampOrigin(origin: Point, windowSize: Size, size: Size): Point {
  return new Point(
    Math.max(0, Math.min(origin.x, size.width - windowSize.width)),
    Math.max(0, Math.min(origin.y, size.height - windowSize.height)),
  )
}

function clampRatio(ratio: number) {
  return Math.max(MIN_RATIO, Math.min(1 - MIN_RATIO, ratio))
}

const CASCADE_STEP_X = 2
const CASCADE_STEP_Y = 1
const DEFAULT_RATIO = 0.5
const MIN_RATIO = 0.1
