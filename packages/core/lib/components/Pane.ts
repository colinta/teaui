import type {Viewport} from '../Viewport.js'
import {View} from '../View.js'
import {Container, type Props as ContainerProps} from '../Container.js'
import {Rect, Point, Size} from '../geometry.js'
import {
  type MouseEvent,
  isMousePressStart,
  isMousePressEnd,
} from '../events/index.js'
import {System} from '../System.js'
import {Style} from '../Style.js'

interface Props extends ContainerProps {
  /**
   * Draw a border around the entire pane.
   * @default false
   */
  border?: boolean
  /**
   * Whether browser panes can be collapsed by clicking the separator or
   * dragging to a very small width. When false, the minimum pane width is 4.
   * @default true
   */
  collapsible?: boolean
}

/** Minimum width when collapsible — below this threshold the pane will collapse on release. */
const COLLAPSE_THRESHOLD = 3
/** Minimum width when NOT collapsible. */
const MIN_PANE_WIDTH_NOT_COLLAPSIBLE = 4
/** Absolute minimum width during drag when collapsible (allows dragging into the collapse zone). */
const MIN_PANE_WIDTH_DRAG = 1
/** Default minimum width (non-drag). */
const MIN_PANE_WIDTH = 5
const SEPARATOR_WIDTH = 1

interface BrowserPane {
  width: number
  collapsed: boolean
}

/**
 * A split-pane container for index/detail layouts. The first N-1 children are
 * collapsible "browser" panes with draggable separators. The last child is the
 * "detail" pane that takes remaining space.
 */
export class Pane extends Container {
  #border: boolean = false
  #collapsible: boolean = true
  #browserPanes: BrowserPane[] = []

  // Drag state
  #dragSeparator: number = -1
  #dragStartX: number = 0
  #dragStartWidth: number = 0

  // Hover state
  #hoverSeparator: number = -1

  // Cached layout info for mouse hit-testing
  #separatorPositions: number[] = []
  #borderInset: number = 0
  #lastAvailableWidth: number = 80

  constructor(props: Props = {}) {
    super(props)
    this.#update(props)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  get border() {
    return this.#border
  }
  set border(value: boolean) {
    if (value === this.#border) return
    this.#border = value
    this.invalidateSize()
  }

  #update({border, collapsible}: Props) {
    this.#border = border ?? false
    this.#collapsible = collapsible ?? true
  }

  /**
   * Returns the browser panes (all children except the last).
   */
  get browserViews(): View[] {
    const children = this.children
    if (children.length <= 1) return []
    return children.slice(0, -1)
  }

  /**
   * Returns the detail pane (the last child).
   */
  get detailView(): View | undefined {
    const children = this.children
    return children.length > 0 ? children[children.length - 1] : undefined
  }

  #ensurePaneState() {
    const browserCount = Math.max(0, this.children.length - 1)
    while (this.#browserPanes.length < browserCount) {
      this.#browserPanes.push({width: 20, collapsed: false})
    }
    if (this.#browserPanes.length > browserCount) {
      this.#browserPanes.length = browserCount
    }
  }

  naturalSize(available: Size): Size {
    this.#ensurePaneState()
    const borderInset = this.#border ? 2 : 0
    const innerAvailable = available.shrink(borderInset, borderInset)

    const browsers = this.browserViews
    let usedWidth = 0
    for (let i = 0; i < browsers.length; i++) {
      const ns = browsers[i].naturalSize(innerAvailable)
      // Initialize widths from natural size on first layout
      if (this.#browserPanes[i].width === 20) {
        this.#browserPanes[i].width = Math.max(
          MIN_PANE_WIDTH,
          Math.min(ns.width, Math.floor(innerAvailable.width / 3)),
        )
      }
      usedWidth +=
        (this.#browserPanes[i].collapsed ? 0 : this.#browserPanes[i].width) +
        SEPARATOR_WIDTH
    }

    const detailNs = this.detailView?.naturalSize(
      innerAvailable.shrink(usedWidth, 0),
    )
    const detailWidth = detailNs?.width ?? 0
    const totalWidth = usedWidth + detailWidth + borderInset

    return new Size(
      Math.min(available.width, Math.max(totalWidth, MIN_PANE_WIDTH)),
      available.height,
    )
  }

  /**
   * Hit-test: given an absolute x position in viewport coordinates,
   * find which separator index (if any) was hit.
   */
  #hitTestSeparator(x: number): number {
    for (let i = 0; i < this.#separatorPositions.length; i++) {
      if (x === this.#separatorPositions[i]) {
        return i
      }
    }
    return -1
  }

  /**
   * Whether a given browser pane is in the "will collapse" zone during a drag.
   */
  #isInCollapseZone(index: number): boolean {
    if (!this.#collapsible) return false
    const pane = this.#browserPanes[index]
    return !pane.collapsed && pane.width <= COLLAPSE_THRESHOLD
  }

  /**
   * Whether a given mouse event is part of an ongoing button-drag gesture.
   * This includes dragInside, dragOutside, exit (leaving the region while
   * dragging), and the initial down event itself.
   */
  #isDragGesture(event: MouseEvent): boolean {
    if (!event.name.startsWith('mouse.button.')) return false
    // up and cancel end the gesture
    if (event.name.endsWith('.up') || event.name.endsWith('.cancel'))
      return false
    return true
  }

  receiveMouse(event: MouseEvent, system: System) {
    super.receiveMouse(event, system)

    const x = event.position.x

    // During a drag, always track the dragged separator
    if (this.#dragSeparator >= 0) {
      if (this.#isDragGesture(event)) {
        const dx = x - this.#dragStartX
        const maxWidth = Math.floor(this.#lastAvailableWidth / 2)
        const pane = this.#browserPanes[this.#dragSeparator]
        if (!pane.collapsed) {
          const minDrag = this.#collapsible
            ? MIN_PANE_WIDTH_DRAG
            : MIN_PANE_WIDTH_NOT_COLLAPSIBLE
          pane.width = Math.max(
            minDrag,
            Math.min(maxWidth, this.#dragStartWidth + dx),
          )
        }
        return
      }

      if (isMousePressEnd(event)) {
        const pane = this.#browserPanes[this.#dragSeparator]
        const dx = Math.abs(x - this.#dragStartX)

        if (
          this.#collapsible &&
          !pane.collapsed &&
          this.#isInCollapseZone(this.#dragSeparator)
        ) {
          // Released in collapse zone — collapse and restore width
          pane.collapsed = true
          pane.width = this.#dragStartWidth
        } else if (dx <= 1) {
          // Click without drag — toggle collapse (only if collapsible)
          if (this.#collapsible) {
            pane.collapsed = !pane.collapsed
          }
        }
        this.#dragSeparator = -1
        return
      }
    }

    const separatorIndex = this.#hitTestSeparator(x)

    // Handle hover
    if (event.name === 'mouse.move.in' || event.name === 'mouse.move.enter') {
      this.#hoverSeparator = separatorIndex
    } else if (event.name === 'mouse.move.exit') {
      this.#hoverSeparator = -1
    }

    // Handle drag start on a separator
    if (isMousePressStart(event) && separatorIndex >= 0) {
      this.#dragSeparator = separatorIndex
      this.#dragStartX = x
      this.#dragStartWidth = this.#browserPanes[separatorIndex].width
    }
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return super.render(viewport)
    }

    this.#ensurePaneState()

    this.#borderInset = this.#border ? 1 : 0
    const innerSize = viewport.contentSize.shrink(
      this.#borderInset * 2,
      this.#borderInset * 2,
    )
    this.#lastAvailableWidth = innerSize.width

    // Draw border if enabled
    if (this.#border) {
      this.#renderBorder(viewport)
    }

    // Panes get the full width minus left/right border, but full height
    // so that #renderSeparator can draw border junctions on the top/bottom rows.
    const panesRect = this.#border
      ? new Rect(
          new Point(this.#borderInset, 0),
          viewport.contentSize.shrink(this.#borderInset * 2, 0),
        )
      : viewport.contentRect

    viewport.clipped(panesRect, inner => {
      this.#renderPanes(inner)
    })
  }

  #renderPanes(viewport: Viewport) {
    const browsers = this.browserViews
    const detail = this.detailView
    const fullHeight = viewport.contentSize.height
    // Child content is inset from top/bottom border rows
    const contentTop = this.#borderInset
    const contentHeight = fullHeight - this.#borderInset * 2
    let x = 0
    this.#separatorPositions = []

    for (let i = 0; i < browsers.length; i++) {
      const pane = this.#browserPanes[i]

      // Render browser pane content (if not collapsed)
      if (!pane.collapsed) {
        const paneWidth = pane.width
        const paneRect = new Rect(
          new Point(x, contentTop),
          new Size(paneWidth, contentHeight),
        )
        viewport.clipped(paneRect, inner => {
          browsers[i].render(inner)
        })
        x += paneWidth
      }

      // Render separator (full height, including border rows)
      this.#separatorPositions.push(x)
      this.#renderSeparator(viewport, i, x, fullHeight, pane.collapsed)
      x += SEPARATOR_WIDTH
    }

    // Render detail pane (fills remaining space)
    if (detail) {
      const detailWidth = Math.max(0, viewport.contentSize.width - x)
      if (detailWidth > 0) {
        const detailRect = new Rect(
          new Point(x, contentTop),
          new Size(detailWidth, contentHeight),
        )
        viewport.clipped(detailRect, inner => {
          detail.render(inner)
        })
      }
    }
  }

  #renderSeparator(
    viewport: Viewport,
    index: number,
    x: number,
    fullHeight: number,
    collapsed: boolean,
  ) {
    const isHover = this.#hoverSeparator === index
    const isDragging = this.#dragSeparator === index
    const willCollapse = isDragging && this.#isInCollapseZone(index)
    const style =
      isHover || isDragging ? this.theme.ui({isHover: true}) : Style.NONE

    const separatorRect = new Rect(
      new Point(x, 0),
      new Size(SEPARATOR_WIDTH, fullHeight),
    )
    viewport.registerMouse(['mouse.move', 'mouse.button.left'], separatorRect)

    const topRow = this.#border ? 0 : -1
    const bottomRow = this.#border ? fullHeight - 1 : -1
    const point = new Point(x, 0).mutableCopy()

    viewport.usingPen(style, () => {
      for (point.y = 0; point.y < fullHeight; point.y++) {
        let char: string
        if (point.y === topRow) {
          char = collapsed ? BORDER_TOP_COLLAPSED : BORDER_TOP_SEP
        } else if (point.y === bottomRow) {
          char = collapsed ? BORDER_BOTTOM_COLLAPSED : BORDER_BOTTOM_SEP
        } else if (collapsed) {
          char = SEP_COLLAPSED
        } else if (willCollapse) {
          char = point.y % 2 === 1 ? SEP_WILL_COLLAPSE : SEP_DEFAULT
        } else {
          char = SEP_DEFAULT
        }
        viewport.write(char, point)
      }
    })
  }

  #renderBorder(viewport: Viewport) {
    const w = viewport.contentSize.width
    const h = viewport.contentSize.height
    const point = new Point(0, 0).mutableCopy()

    // Top edge
    point.y = 0
    for (point.x = 1; point.x < w - 1; point.x++) {
      viewport.write(BORDER_HORIZONTAL, point)
    }

    // Bottom edge
    point.y = h - 1
    for (point.x = 1; point.x < w - 1; point.x++) {
      viewport.write(BORDER_HORIZONTAL, point)
    }

    // Left & right edges
    for (point.y = 1; point.y < h - 1; point.y++) {
      point.x = 0
      viewport.write(BORDER_VERTICAL, point)
      point.x = w - 1
      viewport.write(BORDER_VERTICAL, point)
    }

    // Corners
    viewport.write(BORDER_TOP_LEFT, new Point(0, 0))
    viewport.write(BORDER_TOP_RIGHT, new Point(w - 1, 0))
    viewport.write(BORDER_BOTTOM_LEFT, new Point(0, h - 1))
    viewport.write(BORDER_BOTTOM_RIGHT, new Point(w - 1, h - 1))
  }
}

////
/// Drawing constants
//

// Separator characters
const SEP_DEFAULT = '┃'
const SEP_COLLAPSED = '║'
const SEP_WILL_COLLAPSE = '←'

// Border characters
const BORDER_HORIZONTAL = '─'
const BORDER_VERTICAL = '│'
const BORDER_TOP_LEFT = '╭'
const BORDER_TOP_RIGHT = '╮'
const BORDER_BOTTOM_LEFT = '╰'
const BORDER_BOTTOM_RIGHT = '╯'
const BORDER_TOP_SEP = '┰'
const BORDER_BOTTOM_SEP = '┸'
const BORDER_TOP_COLLAPSED = '╥'
const BORDER_BOTTOM_COLLAPSED = '╨'
