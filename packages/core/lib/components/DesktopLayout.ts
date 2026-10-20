import {Point, Rect, Size} from '../geometry.js'
import type {Window} from './Window.js'
import type {Desktop} from './Desktop.js'
import {
  TilingControls,
  type TilingControlsDelegate,
  type TilingDirection,
  type TilingMode,
  type TilingOrder,
} from './TilingControls.js'

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
  /**
   * `window` became the active window. Layouts can add controls to it with
   * `window.addOverlay()`.
   */
  focus?(window: Window, desktop: Desktop): void
  /**
   * `window` is no longer the active window (or the layout was replaced).
   * Remove anything that `focus` added.
   */
  blur?(window: Window, desktop: Desktop): void
  /**
   * Windows in higher layers are drawn above windows in lower layers,
   * regardless of z-order. Default: 0. (Minimized windows are always in layer
   * 0.)
   */
  layer?(window: Window): number
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
   * The width of the first window, as a fraction of the Desktop width.
   * Default: 0.5
   */
  ratio?: number
}

type Edge = 'top' | 'bottom' | 'left' | 'right'

/**
 * Tiling window management: the first window fills the left side, the other
 * windows are stacked on the right. Drag the borders between the tiles to
 * resize them. A fullscreen (maximized) window covers the tiles, and floating
 * windows are drawn above the tiles, where they can be moved and resized.
 *
 * The active window gets placement controls (see `TilingControls`): a button
 * in its bottom-left corner that expands into a panel of keys, and keys to
 * change focus (⌥w), move windows (⌥m), resize (⌥r), toggle fullscreen (⌥z),
 * and toggle modal/floating (⌥t).
 */
export class TiledLayout implements DesktopLayout, TilingControlsDelegate {
  ratio: number
  // the order of the windows, which moving changes (independent of the
  // order of the Desktop's children)
  #order: Window[] = []
  #floating = new Set<Window>()
  // the relative heights of the stacked windows (by position)
  #weights: number[] = []
  // the results of the last layout
  #tiles: Window[] = []
  #frames = new Map<Window, Rect>()
  #size = Size.zero

  #mode: TilingMode | undefined
  #isExpanded = false
  #active: Window | undefined
  #desktop: Desktop | undefined
  #controls = new TilingControls(this)

  constructor({ratio}: TiledLayoutOptions = {}) {
    this.ratio = clampRatio(ratio ?? DEFAULT_RATIO)
  }

  layout(windows: readonly Window[], size: Size): (Rect | undefined)[] {
    this.#size = size
    this.#syncOrder(windows)

    const frames = new Map<Window, Rect>()
    const ordered = this.#order.filter(window => windows.includes(window))
    for (const window of ordered) {
      if (window.isMaximized) {
        frames.set(window, new Rect(Point.zero, size))
      } else if (this.#floating.has(window)) {
        frames.set(window, this.#floatingFrame(window, size))
      }
    }

    const tiles = ordered.filter(window => !frames.has(window))
    this.#tiles = tiles
    const [main, ...stack] = tiles
    if (main) {
      const mainWidth = stack.length
        ? this.#mainWidth(size.width * this.ratio, size.width)
        : size.width
      frames.set(main, new Rect(Point.zero, [mainWidth, size.height]))

      if (this.#weights.length !== stack.length) {
        this.#weights = stack.map(() => 1)
      }
      const total = this.#weights.reduce((sum, weight) => sum + weight, 0)
      let weight = 0
      let y = 0
      stack.forEach((window, index) => {
        weight += this.#weights[index]
        const nextY = Math.round((size.height * weight) / total)
        frames.set(
          window,
          new Rect([mainWidth, y], [size.width - mainWidth, nextY - y]),
        )
        y = nextY
      })
    }

    this.#frames = frames
    return windows.map(window => frames.get(window))
  }

  /**
   * Keeps the windows in their current order, adds new windows at the end, and
   * forgets windows that were removed. Minimized windows aren't passed to the
   * layout, but they keep their place.
   */
  #syncOrder(windows: readonly Window[]) {
    const order = this.#order.filter(
      window =>
        windows.includes(window) ||
        (window.isMinimized && window.parent !== undefined),
    )
    for (const window of windows) {
      if (!order.includes(window)) {
        order.push(window)
      }
    }
    this.#order = order
    for (const window of this.#floating) {
      if (!order.includes(window)) {
        this.#floating.delete(window)
      }
    }
  }

  #floatingFrame(window: Window, size: Size): Rect {
    const windowSize = window.naturalSize(size).max(size)
    const position =
      window.position ??
      new Point(
        Math.floor((size.width - windowSize.width) / 2),
        Math.floor((size.height - windowSize.height) / 2),
      )
    return new Rect(clampOrigin(position, windowSize, size), windowSize)
  }

  layer(window: Window): number {
    if (window.isMaximized) {
      return FULLSCREEN_LAYER
    }
    return this.#floating.has(window) ? FLOATING_LAYER : TILED_LAYER
  }

  isFloating(window: Window): boolean {
    return this.#floating.has(window)
  }

  /**
   * Floating windows are drawn above the tiles, and can be moved and resized.
   * A window keeps its place in the tiles while it's floating.
   */
  setFloating(window: Window, isFloating: boolean) {
    if (isFloating === this.#floating.has(window)) {
      return
    }

    if (isFloating) {
      this.#floating.add(window)
      const frame = this.#frames.get(window)
      const size = this.#size
      if (window.width === undefined) {
        window.width = Math.round(size.width * FLOATING_SIZE)
      }
      if (window.height === undefined) {
        window.height = Math.round(size.height * FLOATING_SIZE)
      }
      if (!window.position && frame) {
        const windowSize = window.naturalSize(size).max(size)
        window.position = new Point(
          Math.floor((size.width - windowSize.width) / 2),
          Math.floor((size.height - windowSize.height) / 2),
        )
      }
    } else {
      this.#floating.delete(window)
    }
    this.#desktop?.invalidateSize()
  }

  canMove(window: Window) {
    return this.#floating.has(window)
  }

  canResize(window: Window) {
    if (window.isMaximized) {
      return false
    }
    return this.#floating.has(window) || this.#tiles.length > 1
  }

  move(window: Window, origin: Point, size: Size) {
    if (!this.#floating.has(window)) {
      return
    }
    const windowSize = window.naturalSize(size).max(size)
    window.position = clampOrigin(origin, windowSize, size)
  }

  resize(window: Window, frame: Rect, _size: Size) {
    const current = this.#frames.get(window)
    if (!current) {
      return
    }

    if (frame.minX() !== current.minX()) {
      this.#setEdge(window, 'left', frame.minX())
    } else if (frame.maxX() !== current.maxX()) {
      this.#setEdge(window, 'right', frame.maxX())
    }
    if (frame.minY() !== current.minY()) {
      this.#setEdge(window, 'top', frame.minY())
    } else if (frame.maxY() !== current.maxY()) {
      this.#setEdge(window, 'bottom', frame.maxY())
    }
  }

  /**
   * Moves an edge of the window to `value` (a column for left/right, a row for
   * top/bottom), as far as the windows' minimum and maximum sizes and the
   * Desktop allow. Edges of tiles along the Desktop's border can't move.
   */
  #setEdge(window: Window, edge: Edge, value: number) {
    if (this.#floating.has(window)) {
      this.#setFloatingEdge(window, edge, value)
      return
    }

    const index = this.#tiles.indexOf(window)
    if (index === -1 || this.#tiles.length < 2) {
      return
    }

    const {width} = this.#size
    if ((index === 0 && edge === 'right') || (index > 0 && edge === 'left')) {
      this.ratio = clampRatio(this.#mainWidth(value, width) / width)
      return
    }

    // the edge between two stacked windows
    const stackIndex = index - 1
    const stack = this.#tiles.slice(1)
    const upper =
      edge === 'top' ? stackIndex - 1 : edge === 'bottom' ? stackIndex : -1
    if (upper < 0 || upper + 1 >= stack.length) {
      return
    }

    const heights = stack.map(window => this.#frames.get(window)!.size.height)
    const top = this.#frames.get(stack[upper])!.minY()
    const bottom = this.#frames.get(stack[upper + 1])!.maxY()
    const y = Math.max(
      top + stack[upper].minimumSize.height,
      Math.min(bottom - stack[upper + 1].minimumSize.height, value),
    )
    if (y - top <= 0 || bottom - y <= 0) {
      return
    }
    heights[upper] = y - top
    heights[upper + 1] = bottom - y
    this.#weights = heights
  }

  #setFloatingEdge(window: Window, edge: Edge, value: number) {
    const frame = this.#frames.get(window)
    if (!frame) {
      return
    }

    const {width, height} = this.#size
    const minimum = window.minimumSize
    const maximum = window.maximumSize
    let x = frame.minX()
    let y = frame.minY()
    let right = frame.maxX()
    let bottom = frame.maxY()
    switch (edge) {
      case 'left':
        x = clamp(
          value,
          Math.max(0, right - maximum.width),
          right - minimum.width,
        )
        break
      case 'right':
        right = clamp(
          value,
          x + minimum.width,
          Math.min(width, x + maximum.width),
        )
        break
      case 'top':
        y = clamp(
          value,
          Math.max(0, bottom - maximum.height),
          bottom - minimum.height,
        )
        break
      case 'bottom':
        bottom = clamp(
          value,
          y + minimum.height,
          Math.min(height, y + maximum.height),
        )
        break
    }

    window.position = new Point(x, y)
    window.width = right - x
    window.height = bottom - y
  }

  /**
   * Restricts the width of the first window so that both columns keep their
   * minimum widths (when there's room for both).
   */
  #mainWidth(width: number, totalWidth: number): number {
    const [main, ...stack] = this.#tiles
    const mainMinimum = main?.minimumSize.width ?? 0
    const stackMinimum = Math.max(
      0,
      ...stack.map(window => window.minimumSize.width),
    )
    width = Math.round(width)
    if (mainMinimum + stackMinimum > totalWidth) {
      return width
    }
    return Math.max(mainMinimum, Math.min(totalWidth - stackMinimum, width))
  }

  // focus and blur: the active window gets the placement controls

  focus(window: Window, desktop: Desktop) {
    this.#desktop = desktop
    this.#active = window
    window.addOverlay(this.#controls)
  }

  blur(window: Window, desktop: Desktop) {
    window.removeOverlay(this.#controls)
    if (this.#active === window) {
      this.#active = undefined
    }
    if (!desktop.activeWindow) {
      this.#mode = undefined
      this.#isExpanded = false
    }
  }

  // TilingControlsDelegate

  get mode(): TilingMode | undefined {
    return this.#mode
  }

  setMode(mode: TilingMode | undefined) {
    this.#mode = mode
    this.#controls.invalidateRender()
  }

  get isExpanded(): boolean {
    return this.#isExpanded
  }

  setExpanded(isExpanded: boolean) {
    this.#isExpanded = isExpanded
    this.#controls.invalidateRender()
  }

  direction(direction: TilingDirection, shift: boolean) {
    const active = this.#active
    if (!active) {
      return
    }

    switch (this.#mode) {
      case 'focus':
        this.#focus(this.#inDirection(active, direction, this.#focusable()))
        break
      case 'move':
        this.#swap(active, this.#inDirection(active, direction, this.#tiles))
        break
      case 'size':
        this.#resize(active, direction, shift)
        break
    }
  }

  order(order: TilingOrder) {
    const active = this.#active
    if (!active) {
      return
    }

    switch (this.#mode) {
      case 'focus':
        this.#focus(inOrder(active, order, this.#focusable()))
        break
      case 'move':
        this.#swap(active, inOrder(active, order, this.#tiles))
        break
    }
  }

  toggleFullscreen() {
    this.#active?.toggleMaximized()
  }

  toggleFloating() {
    const active = this.#active
    if (active) {
      this.setFloating(active, !this.#floating.has(active))
    }
  }

  /**
   * The windows that can be focused: every window that was laid out, in order.
   */
  #focusable(): Window[] {
    return this.#order.filter(window => this.#frames.has(window))
  }

  #focus(window: Window | undefined) {
    if (!window || window === this.#active) {
      return
    }
    // activating restores the window's focus
    window.activate()
  }

  #swap(active: Window, other: Window | undefined) {
    if (!other || other === active || !this.#tiles.includes(active)) {
      return
    }

    const order = [...this.#order]
    const a = order.indexOf(active)
    const b = order.indexOf(other)
    order[a] = other
    order[b] = active
    this.#order = order
    this.#desktop?.invalidateSize()
  }

  /**
   * Without shift, the edge on that side moves outward (the window grows).
   * With shift, the opposite edge moves inward (the window shrinks). Either
   * way, the edge moves in the direction of the arrow.
   */
  #resize(window: Window, direction: TilingDirection, shift: boolean) {
    const frame = this.#frames.get(window)
    if (!frame || window.isMaximized) {
      return
    }

    const side = shift ? OPPOSITE[direction] : direction
    const edge = SIDE_EDGE[side]
    const delta = direction === 'up' || direction === 'left' ? -1 : 1
    const position = {
      top: frame.minY(),
      bottom: frame.maxY(),
      left: frame.minX(),
      right: frame.maxX(),
    }[edge]
    this.#setEdge(window, edge, position + delta)
    this.#desktop?.invalidateSize()
  }

  /**
   * The closest window in that direction, measured between the centers of the
   * windows. Windows that overlap on the other axis are preferred.
   */
  #inDirection(
    active: Window,
    direction: TilingDirection,
    candidates: readonly Window[],
  ): Window | undefined {
    const from = this.#frames.get(active)
    if (!from) {
      return undefined
    }

    const isHorizontal = direction === 'left' || direction === 'right'
    const sign = direction === 'up' || direction === 'left' ? -1 : 1
    const center = (rect: Rect) =>
      new Point(
        rect.minX() + rect.size.width / 2,
        rect.minY() + rect.size.height / 2,
      )
    const fromCenter = center(from)

    let best: Window | undefined
    let bestScore = Infinity
    for (const window of candidates) {
      const frame = this.#frames.get(window)
      if (window === active || !frame) {
        continue
      }

      const to = center(frame)
      const distance = isHorizontal
        ? (to.x - fromCenter.x) * sign
        : (to.y - fromCenter.y) * sign
      if (distance <= 0) {
        continue
      }

      const overlaps = isHorizontal
        ? frame.minY() < from.maxY() && frame.maxY() > from.minY()
        : frame.minX() < from.maxX() && frame.maxX() > from.minX()
      const offset = isHorizontal
        ? Math.abs(to.y - fromCenter.y)
        : Math.abs(to.x - fromCenter.x)
      const score = distance + (overlaps ? 0 : NON_OVERLAP_PENALTY) + offset
      if (score < bestScore) {
        best = window
        bestScore = score
      }
    }
    return best
  }
}

function inOrder(
  active: Window,
  order: TilingOrder,
  windows: readonly Window[],
): Window | undefined {
  if (!windows.length) {
    return undefined
  }

  const index = windows.indexOf(active)
  switch (order) {
    case 'first':
      return windows[0]
    case 'last':
      return windows.at(-1)
    case 'prev':
      return index === -1
        ? windows.at(-1)
        : windows[(index - 1 + windows.length) % windows.length]
    case 'next':
      return index === -1 ? windows[0] : windows[(index + 1) % windows.length]
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
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
const TILED_LAYER = 0
const FLOATING_LAYER = 1
const FULLSCREEN_LAYER = 2
// the size of a window that starts floating, as a fraction of the Desktop
const FLOATING_SIZE = 0.6
// windows that don't overlap the active window are further away
const NON_OVERLAP_PENALTY = 1000

const OPPOSITE: Record<TilingDirection, TilingDirection> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}
const SIDE_EDGE: Record<TilingDirection, Edge> = {
  up: 'top',
  down: 'bottom',
  left: 'left',
  right: 'right',
}
