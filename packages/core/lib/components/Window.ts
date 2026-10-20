import * as unicode from '@teaui/term'

import type {Viewport} from '../Viewport.js'
import type {View} from '../View.js'
import type {Screen} from '../Screen.js'
import {type Props as ContainerProps, Container} from '../Container.js'
import {Point, Rect, Size} from '../geometry.js'
import {Style} from '../Style.js'
import {type MouseEvent} from '../events/index.js'
import {Text} from './Text.js'

/**
 * A parent that manages the placement of its `Window` children (see `Desktop`).
 * Windows ask their host to move, resize, and raise them. Without a host
 * (e.g. in a `Stack`), a Window can be resized but not moved.
 */
export interface WindowHost {
  readonly [WINDOW_HOST]: true
  /** Raises the window above its siblings. */
  activateWindow(window: Window): void
  /** The topmost window is the active window. */
  isActiveWindow(window: Window): boolean
  canMoveWindow(window: Window): boolean
  canResizeWindow(window: Window): boolean
  /** `origin` is the requested location, in the host's coordinates. */
  moveWindow(window: Window, origin: Point): void
  /** `frame` is the requested frame, in the host's coordinates. */
  resizeWindow(window: Window, frame: Rect): void
}

export const WINDOW_HOST = Symbol('WindowHost')

export function windowHost(view: View | undefined): WindowHost | undefined {
  if (view && (view as Partial<WindowHost>)[WINDOW_HOST] === true) {
    return view as unknown as WindowHost
  }
  return undefined
}

/**
 * 'restore' is the only button on a minimized window (and is always shown).
 */
export type WindowButton = 'close' | 'minimize' | 'maximize' | 'restore'
type Edge =
  | 'top-left'
  | 'top-right'
  | 'left'
  | 'right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right'
type Region = WindowButton | Edge | 'title' | 'content'

/**
 * Views placed in a Window's title bar, to the right of the title and to the
 * left of the minimize/maximize buttons. Each view is given its natural width
 * and a height of 1.
 *
 *     new Window({title: 'Notes', children: [new Window.TitleBar({child: saveButton}), content]})
 */
export class WindowTitleBar extends Container {
  naturalSize(available: Size): Size {
    let width = 0
    for (const child of this.children) {
      if (!child.isVisible) {
        continue
      }
      width += childWidth(child, available)
    }
    return new Size(width, TITLE_BAR_HEIGHT)
  }

  render(viewport: Viewport) {
    let x = 0
    for (const child of this.children) {
      if (!child.isVisible) {
        continue
      }
      const width = childWidth(child, viewport.contentSize)
      viewport.clipped(new Rect([x, 0], [width, TITLE_BAR_HEIGHT]), inside =>
        child.render(inside),
      )
      x += width
    }
  }
}

export interface Props extends Omit<
  ContainerProps,
  'x' | 'y' | 'width' | 'height'
> {
  /** Drawn in the title bar, truncated with an ellipsis when necessary. */
  title?: string
  /** Core only: views to place in the title bar, see `Window.TitleBar`. */
  titleBar?: View[]
  /** Show the close button. Default: true */
  showClose?: boolean
  /** Show the minimize button. Default: true */
  showMinimize?: boolean
  /** Show the maximize button. Default: true */
  showMaximize?: boolean
  /** Whether the borders can be dragged to resize the window. Default: true */
  resizable?: boolean
  /**
   * Whether the title bar can be dragged to move the window. Only windows in a
   * `WindowHost` (`Desktop`) can be moved. Default: true
   */
  movable?: boolean
  isMinimized?: boolean
  isMaximized?: boolean
  /** Location of the window in its `Desktop`. */
  x?: number
  y?: number
  /** Size of the window, including its border. */
  width?: number
  height?: number
  /**
   * Called when the close button is pressed. Without `onClose`, the window
   * removes itself from its parent. React apps should handle `onClose` and
   * stop rendering the window.
   */
  onClose?: () => void
  onMinimize?: (isMinimized: boolean) => void
  onMaximize?: (isMaximized: boolean) => void
  /** Called after the user moves the window. */
  onMove?: (position: Point) => void
  /** Called after the user resizes the window. */
  onResize?: (size: Size) => void
  /** Called when the window becomes the active window. */
  onActivate?: () => void
}

/**
 * The props that are only applied when they change, so that a React re-render
 * doesn't undo the user moving, resizing, or minimizing the window.
 */
interface StateProps {
  x?: number
  y?: number
  width?: number
  height?: number
  isMinimized?: boolean
  isMaximized?: boolean
}

interface Press {
  region: Region
  start: Point
  frame: Rect
}

interface TitleBarLayout {
  close: number | undefined
  minimize: number | undefined
  maximize: number | undefined
  restore: number | undefined
  title: {x: number; width: number} | undefined
  titleBar: {x: number; width: number} | undefined
}

let activationCounter = 0

/**
 * A movable, resizable window with a title bar: close button on the left,
 * optional title and title bar views, and minimize/maximize buttons on the
 * right. The active window is drawn with a double border.
 *
 * Windows are usually children of a `Desktop`, which manages their placement and
 * z-order. In other containers (e.g. a `Stack`) a Window can be resized, but not
 * moved.
 */
export class Window extends Container {
  static TitleBar = WindowTitleBar

  #titleView: Text
  #titleBar: WindowTitleBar | undefined
  // the title bar created from the `titleBar` prop (vs. a child TitleBar)
  #ownsTitleBar = false
  #title: string | undefined
  #showClose = true
  #showMinimize = true
  #showMaximize = true
  #resizable = true
  #movable = true
  #isMinimized = false
  #isMaximized = false
  #position: Point | undefined
  #width: number | undefined
  #height: number | undefined
  #minWidth: number | undefined
  #minHeight: number | undefined
  #maxWidth: number | undefined
  #maxHeight: number | undefined
  #stateProps: StateProps = {}
  #onClose: Props['onClose']
  #onMinimize: Props['onMinimize']
  #onMaximize: Props['onMaximize']
  #onMove: Props['onMove']
  #onResize: Props['onResize']
  #onActivate: Props['onActivate']

  #activatedAt = 0
  // views drawn over the window, see addOverlay
  #overlays: View[] = []
  // the last view inside this window that had keyboard focus
  #lastFocused: View | undefined
  // the size the window was drawn at (can be smaller than contentSize)
  #frameSize = Size.zero
  #hover: Region | undefined
  #press: Press | undefined
  #unsubscribe: (() => void)[] = []

  constructor({child, children, titleBar, ...props}: Props = {}) {
    super(viewProps(props))

    this.#titleView = new Text({ellipsis: true})
    super.add(this.#titleView)

    this.#update(props)
    if (titleBar) {
      this.#setTitleBarViews(titleBar)
    }

    if (child) {
      this.add(child)
    } else if (children) {
      for (const child of children) {
        this.add(child)
      }
    }
  }

  update({titleBar, ...props}: Props) {
    this.#update(props)
    super.update(viewProps(props))
    if (titleBar) {
      this.#setTitleBarViews(titleBar)
    }
  }

  #update({
    title,
    showClose,
    showMinimize,
    showMaximize,
    resizable,
    movable,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    onClose,
    onMinimize,
    onMaximize,
    onMove,
    onResize,
    onActivate,
    ...stateProps
  }: Omit<Props, 'titleBar'>) {
    this.title = title
    this.#showClose = showClose ?? true
    this.#showMinimize = showMinimize ?? true
    this.#showMaximize = showMaximize ?? true
    this.#resizable = resizable ?? true
    this.#movable = movable ?? true
    this.#minWidth = minWidth
    this.#minHeight = minHeight
    this.#maxWidth = maxWidth
    this.#maxHeight = maxHeight
    this.#onClose = onClose
    this.#onMinimize = onMinimize
    this.#onMaximize = onMaximize
    this.#onMove = onMove
    this.#onResize = onResize
    this.#onActivate = onActivate
    this.#updateState(stateProps)
  }

  #updateState({x, y, width, height, isMinimized, isMaximized}: StateProps) {
    const prev = this.#stateProps
    if (x !== prev.x || y !== prev.y) {
      if (x !== undefined || y !== undefined) {
        this.#position = new Point(
          x ?? this.#position?.x ?? 0,
          y ?? this.#position?.y ?? 0,
        )
      }
    }
    if (width !== prev.width) {
      this.#width = width
    }
    if (height !== prev.height) {
      this.#height = height
    }
    if (isMinimized !== prev.isMinimized && isMinimized !== undefined) {
      this.#isMinimized = isMinimized
    }
    if (isMaximized !== prev.isMaximized && isMaximized !== undefined) {
      this.#isMaximized = isMaximized
    }
    this.#stateProps = {x, y, width, height, isMinimized, isMaximized}
  }

  get title(): string | undefined {
    return this.#title
  }
  set title(value: string | undefined) {
    this.#title = value || undefined
    this.#titleView.text = value ?? ''
    this.invalidateSize()
  }

  /**
   * The location of the window in its `Desktop`. Undefined until the window is
   * placed (when the Desktop's layout chooses a location).
   */
  get position(): Point | undefined {
    return this.#position
  }
  set position(value: Point | undefined) {
    if (value === this.#position || (value && this.#position?.isEqual(value))) {
      return
    }
    this.#position = value
    this.invalidateSize()
  }

  get width(): number | undefined {
    return this.#width
  }
  set width(value: number | undefined) {
    if (value === this.#width) {
      return
    }
    this.#width = value
    this.invalidateSize()
  }

  get height(): number | undefined {
    return this.#height
  }
  set height(value: number | undefined) {
    if (value === this.#height) {
      return
    }
    this.#height = value
    this.invalidateSize()
  }

  get isMinimized(): boolean {
    return this.#isMinimized
  }
  set isMinimized(value: boolean) {
    if (value === this.#isMinimized) {
      return
    }
    this.#isMinimized = value
    this.invalidateSize()
  }

  get isMaximized(): boolean {
    return this.#isMaximized
  }
  set isMaximized(value: boolean) {
    if (value === this.#isMaximized) {
      return
    }
    this.#isMaximized = value
    this.invalidateSize()
  }

  /**
   * The active window is drawn with a double border. In a `Desktop` it's the
   * topmost window; otherwise it's the most recently activated sibling window.
   * Minimized windows are never active.
   */
  get isActive(): boolean {
    const host = windowHost(this.parent)
    if (host) {
      return host.isActiveWindow(this)
    }

    // minimized windows are never active
    let active: Window | undefined
    for (const sibling of this.parent?.children ?? [this]) {
      if (
        !(sibling instanceof Window) ||
        !sibling.isVisible ||
        sibling.#isMinimized
      ) {
        continue
      }
      if (!active || sibling.#activatedAt >= active.#activatedAt) {
        active = sibling
      }
    }
    return active === this
  }

  /**
   * Makes this the active window (and raises it, in a `Desktop`). When the
   * window becomes active, the view inside it that last had keyboard focus gets
   * it back (see `restoreFocus`), unless `restoreFocus` is false.
   */
  activate({restoreFocus = true}: {restoreFocus?: boolean} = {}) {
    const wasActive = this.isActive
    const host = windowHost(this.parent)
    if (host) {
      host.activateWindow(this)
    } else if (!wasActive || this.#activatedAt === 0) {
      this.#activatedAt = ++activationCounter
      this.invalidateRender()
    }

    if (!wasActive && this.isActive) {
      if (restoreFocus) {
        this.restoreFocus()
      }
      this.#onActivate?.()
    }
  }

  /**
   * The smallest size the window can be resized to: room for the corners, the
   * buttons, a shortened title, and the title bar views (and `minWidth`/
   * `minHeight`, if they're larger).
   */
  get minimumSize(): Size {
    const width =
      CORNERS_WIDTH +
      BUTTON_WIDTH * this.#buttonCount() +
      (this.#title ? MIN_TITLE_WIDTH : 0) +
      this.#titleBarWidth(UNBOUNDED)
    return new Size(
      Math.max(width, this.#minWidth ?? 0),
      Math.max(MIN_HEIGHT, this.#minHeight ?? 0),
    )
  }

  get maximumSize(): Size {
    const minimum = this.minimumSize
    return new Size(
      Math.max(minimum.width, this.#maxWidth ?? Infinity),
      Math.max(minimum.height, this.#maxHeight ?? Infinity),
    )
  }

  /**
   * The width of the title bar with the full title (used for minimized
   * windows). A minimized window's title bar has only the title and the
   * restore button.
   */
  get naturalTitleBarWidth(): number {
    const titleWidth = this.#title
      ? unicode.lineWidth(this.#title) + TITLE_PADDING_WIDTH
      : 0
    if (this.#isMinimized) {
      return CORNERS_WIDTH + BUTTON_WIDTH + titleWidth
    }

    return (
      CORNERS_WIDTH +
      BUTTON_WIDTH * this.#buttonCount() +
      (this.#showMinimize && this.#showMaximize ? BUTTON_SEPARATOR_WIDTH : 0) +
      titleWidth +
      this.#titleBarWidth(UNBOUNDED)
    )
  }

  get contentViews(): View[] {
    return this.children.filter(
      child =>
        child !== this.#titleView &&
        !(child instanceof WindowTitleBar) &&
        !this.#overlays.includes(child),
    )
  }

  /**
   * Views drawn over the whole window (border included), after the content and
   * the title bar. `Desktop` layouts use these to add controls to the active
   * window (see `TiledLayout`). Each overlay is given the window's frame, and
   * draws (and registers mouse events) only where it needs to.
   */
  get overlays(): readonly View[] {
    return this.#overlays
  }

  addOverlay(view: View) {
    if (this.#overlays.includes(view)) {
      return
    }
    this.#overlays = [...this.#overlays, view]
    super.add(view)
  }

  removeOverlay(view: View) {
    if (!this.#overlays.includes(view)) {
      return
    }
    this.#overlays = this.#overlays.filter(overlay => overlay !== view)
    super.removeChild(view)
  }

  add(child: View, at?: number) {
    super.add(child, at)
    if (child instanceof WindowTitleBar && child !== this.#titleBar) {
      if (this.#ownsTitleBar && this.#titleBar) {
        super.removeChild(this.#titleBar)
      }
      this.#titleBar = child
      this.#ownsTitleBar = false
    }
  }

  removeChild(child: View) {
    if (
      child === this.#titleView ||
      (child === this.#titleBar && this.#ownsTitleBar) ||
      this.#overlays.includes(child)
    ) {
      return
    }

    super.removeChild(child)
    if (child === this.#titleBar) {
      this.#titleBar = undefined
    }
  }

  removeAllChildren() {
    for (const child of [...this.children]) {
      this.removeChild(child)
    }
  }

  #setTitleBarViews(views: View[]) {
    if (!this.#titleBar || !this.#ownsTitleBar) {
      const titleBar = new WindowTitleBar()
      this.add(titleBar)
      this.#ownsTitleBar = true
    }
    this.#titleBar!.update({children: views})
  }

  didMount(screen: Screen) {
    this.#unsubscribe = [
      // pressing anywhere in the window activates it
      screen.on('mousePress', view => {
        if (this.#contains(view)) {
          this.activate()
        }
      }),
      // focusing a view in the window activates it - before the focus
      // changes, because inactive windows disable focus
      screen.on('focusRequest', view => {
        if (this.#contains(view)) {
          this.#lastFocused = view
          this.activate({restoreFocus: false})
        }
      }),
      screen.on('focusChange', view => {
        if (view && this.#contains(view)) {
          this.#lastFocused = view
          this.activate({restoreFocus: false})
        }
      }),
    ]
  }

  /**
   * Gives keyboard focus back to the view inside this window that last had it
   * (if it's still in the window). Used when a window is activated from the
   * keyboard, so that typing goes to the window that is now active.
   *
   * @return Whether a view was focused.
   */
  restoreFocus(): boolean {
    const view = this.#lastFocused
    if (!view || !this.#contains(view) || !this.screen) {
      return false
    }
    return this.screen.requestFocus(view)
  }

  didUnmount(_screen: Screen) {
    for (const unsubscribe of this.#unsubscribe) {
      unsubscribe()
    }
    this.#unsubscribe = []
    this.#hover = undefined
    this.#press = undefined
  }

  #contains(view: View): boolean {
    for (let node: View | undefined = view; node; node = node.parent) {
      if (node === this) {
        return true
      }
    }
    return false
  }

  #buttonCount() {
    return (
      Number(this.#showClose) +
      Number(this.#showMinimize) +
      Number(this.#showMaximize)
    )
  }

  #titleBarWidth(available: Size): number {
    if (!this.#titleBar?.isVisible) {
      return 0
    }
    const {width} = this.#titleBar.naturalSize(available)
    return Number.isFinite(width) ? width : 0
  }

  naturalSize(available: Size): Size {
    if (this.#isMaximized && !this.#isMinimized) {
      return available
    }

    const minimum = this.minimumSize
    const maximum = this.maximumSize
    let width = this.#width
    let height = this.#height
    if (width === undefined || height === undefined) {
      const content = this.#contentNaturalSize(
        available.shrink(BORDER_WIDTH, BORDER_HEIGHT),
      )
      width ??= content.width + BORDER_WIDTH
      height ??= content.height + BORDER_HEIGHT
    }

    width = clamp(width, minimum.width, maximum.width)
    height = this.#isMinimized
      ? MINIMIZED_HEIGHT
      : clamp(height, minimum.height, maximum.height)
    return new Size(width, height)
  }

  #contentNaturalSize(available: Size): Size {
    let width = 0
    let height = 0
    for (const child of this.contentViews) {
      if (!child.isVisible) {
        continue
      }
      const size = child.naturalSize(available)
      width = Math.max(width, size.width)
      height = Math.max(height, size.height)
    }
    return new Size(width, height)
  }

  /**
   * Inactive windows draw their contents with focus disabled
   * (`viewport.withFocusDisabled`): the views inside can't take keyboard focus
   * until the window is activated.
   */
  render(viewport: Viewport) {
    if (this.isActive) {
      this.#render(viewport)
    } else {
      viewport.withFocusDisabled(inside => this.#render(inside))
    }
  }

  #render(viewport: Viewport) {
    if (viewport.isEmpty) {
      // children still register their hotkeys and focus
      this.#renderContent(viewport, EMPTY_RECT)
      if (this.#titleBar) {
        const titleBar = this.#titleBar
        viewport.clipped(EMPTY_RECT, inside => titleBar.render(inside))
      }
      this.#renderOverlays(viewport)
      return
    }

    const frameSize = this.#frameSizeIn(viewport.contentSize)
    this.#frameSize = frameSize
    viewport.clipped(new Rect(Point.zero, frameSize), inside =>
      this.#renderWindow(inside),
    )
  }

  /**
   * In a WindowHost, the window fills the frame it's given. Elsewhere (e.g. a
   * Stack that stretches its children), the window keeps its own width and
   * height, if it has one.
   */
  #frameSizeIn(available: Size): Size {
    if (windowHost(this.parent) || (this.#isMaximized && !this.#isMinimized)) {
      return available
    }

    const natural = this.naturalSize(available)
    return new Size(
      this.#width === undefined ? available.width : natural.width,
      this.#height === undefined && !this.#isMinimized
        ? available.height
        : natural.height,
    ).max(available)
  }

  #renderWindow(viewport: Viewport) {
    viewport.registerMouse(['mouse.button.left', 'mouse.move'])

    const {width, height} = viewport.contentSize
    const isActive = this.isActive
    const chars = isActive ? ACTIVE_CHARS : INACTIVE_CHARS
    const borderStyle = this.#borderStyle(isActive)

    // the interior is painted with 'write' (not 'paint') so that windows
    // below this one stop receiving mouse events here.
    const interior = ' '.repeat(Math.max(0, width - BORDER_WIDTH))
    const contentStyle = this.#contentStyle()
    for (let y = TITLE_BAR_HEIGHT; y < height - 1; ++y) {
      viewport.write(interior, new Point(1, y), contentStyle)
    }

    const contentRect = new Rect(
      [1, TITLE_BAR_HEIGHT],
      [
        Math.max(0, width - BORDER_WIDTH),
        this.#isMinimized ? 0 : Math.max(0, height - BORDER_HEIGHT),
      ],
    )
    this.#renderContent(viewport, contentRect)

    viewport.usingPen(borderStyle, () => {
      for (let y = TITLE_BAR_HEIGHT; y < height - 1; ++y) {
        viewport.write(chars.vertical, new Point(0, y))
        viewport.write(chars.vertical, new Point(width - 1, y))
      }
      if (height > 1) {
        viewport.write(
          chars.bottomLeft +
            chars.horizontal.repeat(Math.max(0, width - CORNERS_WIDTH)) +
            chars.bottomRight,
          new Point(0, height - 1),
        )
      }
    })

    this.#renderTitleBar(viewport, isActive)
    this.#renderOverlays(viewport)
  }

  #renderOverlays(viewport: Viewport) {
    for (const overlay of this.#overlays) {
      if (overlay.isVisible) {
        overlay.render(viewport)
      }
    }
  }

  #renderContent(viewport: Viewport, rect: Rect) {
    // like Box, the content is drawn over the painted interior, with the
    // parent's pen (not the content style)
    viewport.clipped(rect, inside => {
      for (const child of this.contentViews) {
        if (child.isVisible) {
          child.render(inside)
        }
      }
    })
  }

  #renderTitleBar(viewport: Viewport, isActive: boolean) {
    const {width} = viewport.contentSize
    const chars = isActive ? ACTIVE_CHARS : INACTIVE_CHARS
    const borderStyle = this.#borderStyle(isActive)
    const layout = this.#titleBarLayout(width)

    viewport.write(
      chars.topLeft +
        chars.horizontal.repeat(Math.max(0, width - CORNERS_WIDTH)) +
        chars.topRight,
      Point.zero,
      borderStyle,
    )

    if (layout.title) {
      const {x, width: titleWidth} = layout.title
      const titleStyle = this.#titleStyle(isActive)
      viewport.write(' '.repeat(titleWidth), new Point(x, 0), titleStyle)
      // the Text inherits the title style from the pen
      viewport.clipped(
        new Rect(
          [x + TITLE_PADDING_WIDTH / 2, 0],
          [titleWidth - TITLE_PADDING_WIDTH, TITLE_BAR_HEIGHT],
        ),
        titleStyle,
        inside => this.#titleView.render(inside),
      )
    }

    if (layout.titleBar && this.#titleBar) {
      const titleBar = this.#titleBar
      viewport.clipped(
        new Rect([layout.titleBar.x, 0], [layout.titleBar.width, 1]),
        inside => titleBar.render(inside),
      )
    } else if (this.#titleBar) {
      const titleBar = this.#titleBar
      viewport.clipped(EMPTY_RECT, inside => titleBar.render(inside))
    }

    const buttons: [WindowButton, number | undefined][] = [
      ['close', layout.close],
      ['minimize', layout.minimize],
      ['maximize', layout.maximize],
      ['restore', layout.restore],
    ]
    for (const [button, x] of buttons) {
      if (x === undefined) {
        continue
      }
      const isHighlighted = this.#isHighlighted(button)
      const style = isHighlighted
        ? this.#buttonHighlightStyle(button)
        : borderStyle
      const [left, right] =
        button === 'close'
          ? isHighlighted
            ? [chars.highlightLeft, chars.highlightVertical]
            : [chars.capLeft, chars.closeRight]
          : isHighlighted
            ? [chars.highlightLeft, chars.highlightRight]
            : [chars.capLeft, chars.capRight]
      viewport.write(
        left + BUTTON_GLYPHS[button] + right,
        new Point(x, 0),
        style,
      )
    }
  }

  #titleBarLayout(width: number): TitleBarLayout {
    const layout: TitleBarLayout = {
      close: undefined,
      minimize: undefined,
      maximize: undefined,
      restore: undefined,
      title: undefined,
      titleBar: undefined,
    }

    if (this.#isMinimized) {
      return this.#minimizedTitleBarLayout(width, layout)
    }

    let left = 1
    if (this.#showClose) {
      layout.close = left
      left += BUTTON_WIDTH
    }

    let right = width - 1
    if (this.#showMaximize) {
      right -= BUTTON_WIDTH
      layout.maximize = right
    }

    const titleBarWidth = this.#titleBarWidth(new Size(width, 1))
    const naturalTitleWidth = this.#title
      ? unicode.lineWidth(this.#title) + TITLE_PADDING_WIDTH
      : 0
    let remaining =
      right - left - (this.#showMinimize ? BUTTON_WIDTH : 0) - titleBarWidth
    if (
      this.#showMinimize &&
      this.#showMaximize &&
      hasSeparator(remaining, naturalTitleWidth)
    ) {
      right -= BUTTON_SEPARATOR_WIDTH
      remaining -= BUTTON_SEPARATOR_WIDTH
    }

    if (this.#showMinimize) {
      right -= BUTTON_WIDTH
      layout.minimize = right
    }

    if (titleBarWidth > 0) {
      right -= titleBarWidth
      layout.titleBar = {x: right, width: titleBarWidth}
    }

    if (this.#title) {
      const titleWidth = Math.min(remaining, naturalTitleWidth)
      if (titleWidth > TITLE_PADDING_WIDTH) {
        layout.title = {x: left, width: titleWidth}
      }
    }

    return layout
  }

  /**
   * A minimized window shows only its title and the restore button, which is
   * always shown (regardless of `showMinimize` and the other buttons).
   */
  #minimizedTitleBarLayout(
    width: number,
    layout: TitleBarLayout,
  ): TitleBarLayout {
    const right = width - 1 - BUTTON_WIDTH
    layout.restore = right
    if (this.#title) {
      const left = 1
      const titleWidth = Math.min(
        right - left,
        unicode.lineWidth(this.#title) + TITLE_PADDING_WIDTH,
      )
      if (titleWidth > TITLE_PADDING_WIDTH) {
        layout.title = {x: left, width: titleWidth}
      }
    }
    return layout
  }

  #regionAt(point: Point, size: Size): Region | undefined {
    const {x, y} = point
    const {width, height} = size
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return undefined
    }

    if (y === 0) {
      if (x === 0) {
        return 'top-left'
      } else if (x === width - 1) {
        return 'top-right'
      }

      const layout = this.#titleBarLayout(width)
      for (const button of BUTTONS) {
        const buttonX = layout[button]
        if (
          buttonX !== undefined &&
          x >= buttonX &&
          x < buttonX + BUTTON_WIDTH
        ) {
          return button
        }
      }
      return 'title'
    }

    if (y === height - 1) {
      if (x === 0) {
        return 'bottom-left'
      } else if (x === width - 1) {
        return 'bottom-right'
      }
      return 'bottom'
    }

    if (x === 0) {
      return 'left'
    } else if (x === width - 1) {
      return 'right'
    }

    return 'content'
  }

  #canMove(): boolean {
    const host = windowHost(this.parent)
    return (
      this.#movable &&
      !this.#isMaximized &&
      !this.#isMinimized &&
      host !== undefined &&
      host.canMoveWindow(this)
    )
  }

  #canResize(edge: Edge): boolean {
    if (!this.#resizable || this.#isMaximized || this.#isMinimized) {
      return false
    }

    const host = windowHost(this.parent)
    if (host) {
      return host.canResizeWindow(this)
    }

    // without a host, the window can't move, so only the right and bottom
    // edges can be dragged.
    return edge === 'right' || edge === 'bottom' || edge === 'bottom-right'
  }

  #isHighlighted(button: WindowButton): boolean {
    if (this.#press) {
      return this.#press.region === button && this.#hover === button
    }
    return this.#hover === button
  }

  receiveMouse(event: MouseEvent) {
    const size = this.#frameSize
    const region = this.#regionAt(event.position, size)

    switch (event.name) {
      case 'mouse.move.enter':
      case 'mouse.move.in':
        this.#setHover(region)
        break
      case 'mouse.move.below':
      case 'mouse.move.exit':
        this.#setHover(undefined)
        break
      case 'mouse.button.down':
        this.activate()
        if (region) {
          this.#press = {
            region,
            start: event.position,
            frame: new Rect(this.origin, size),
          }
        }
        this.#setHover(region)
        break
      case 'mouse.button.enter':
      case 'mouse.button.exit':
      case 'mouse.button.dragInside':
      case 'mouse.button.dragOutside':
        this.#setHover(region)
        this.#drag(event.position)
        break
      case 'mouse.button.up': {
        const press = this.#press
        this.#press = undefined
        if (press && region === press.region && isButton(region)) {
          this.#pressButton(region)
        } else if (press) {
          this.#drag(event.position, press)
        }
        this.invalidateRender()
        break
      }
      case 'mouse.button.cancel':
        this.#press = undefined
        this.#setHover(undefined)
        break
    }
  }

  #setHover(region: Region | undefined) {
    if (region !== this.#hover) {
      this.#hover = region
      this.invalidateRender()
    }
  }

  /**
   * Like pressing the maximize button: toggles `isMaximized` (restoring a
   * minimized window), and calls `onMaximize`. The `isMaximized` setter doesn't
   * call `onMaximize`.
   */
  toggleMaximized() {
    this.#pressButton('maximize')
  }

  #pressButton(button: WindowButton) {
    switch (button) {
      case 'close':
        if (this.#onClose) {
          this.#onClose()
        } else {
          this.removeFromParent()
        }
        break
      case 'minimize':
        this.isMinimized = !this.#isMinimized
        this.#onMinimize?.(this.#isMinimized)
        break
      case 'maximize':
        this.isMinimized = false
        this.isMaximized = !this.#isMaximized
        this.#onMaximize?.(this.#isMaximized)
        break
      case 'restore':
        this.isMinimized = false
        this.#onMinimize?.(false)
        break
    }
  }

  #drag(position: Point, press = this.#press) {
    if (!press) {
      return
    }

    const dx = position.x - press.start.x
    const dy = position.y - press.start.y
    if (press.region === 'title') {
      if (!this.#canMove()) {
        return
      }

      const prev = this.#position
      windowHost(this.parent)!.moveWindow(
        this,
        press.frame.origin.offset(dx, dy),
      )
      if (this.#position && !prev?.isEqual(this.#position)) {
        this.#onMove?.(this.#position)
      }
      return
    }

    if (!isEdge(press.region) || !this.#canResize(press.region)) {
      return
    }

    const edge = press.region
    const {frame} = press
    const minimum = this.minimumSize
    const maximum = this.maximumSize
    let {x, y} = frame.origin
    let {width, height} = frame.size
    if (edge.includes('right')) {
      width = clamp(frame.size.width + dx, minimum.width, maximum.width)
    } else if (edge.includes('left')) {
      width = clamp(frame.size.width - dx, minimum.width, maximum.width)
      x = frame.origin.x + frame.size.width - width
    }
    if (edge.includes('bottom')) {
      height = clamp(frame.size.height + dy, minimum.height, maximum.height)
    } else if (edge.includes('top')) {
      height = clamp(frame.size.height - dy, minimum.height, maximum.height)
      y = frame.origin.y + frame.size.height - height
    }

    const prevPosition = this.#position
    const prevWidth = this.#width
    const prevHeight = this.#height
    const host = windowHost(this.parent)
    if (host) {
      host.resizeWindow(this, new Rect([x, y], [width, height]))
    } else {
      this.width = width
      this.height = height
    }

    if (this.#position && !prevPosition?.isEqual(this.#position)) {
      this.#onMove?.(this.#position)
    }
    if (
      (this.#width !== prevWidth || this.#height !== prevHeight) &&
      this.#width !== undefined &&
      this.#height !== undefined
    ) {
      this.#onResize?.(new Size(this.#width, this.#height))
    }
  }

  #borderStyle(isActive: boolean): Style {
    return this.purpose.text({tone: isActive ? 'default' : 'muted'})
  }

  #titleStyle(isActive: boolean): Style {
    return this.#borderStyle(isActive).merge({underline: true, bold: isActive})
  }

  #buttonHighlightStyle(button: WindowButton): Style {
    return this.purpose.ui({
      isPressed: this.#press?.region === button,
      isHover: true,
    })
  }

  #contentStyle(): Style {
    return new Style({background: this.purpose.flatBackgroundColor})
  }
}

/**
 * Removes the props that Window manages itself, so that `View` doesn't offset
 * or restrict the Window.
 */
function viewProps({
  x: _x,
  y: _y,
  width: _width,
  height: _height,
  minWidth: _minWidth,
  minHeight: _minHeight,
  maxWidth: _maxWidth,
  maxHeight: _maxHeight,
  ...props
}: Omit<Props, 'titleBar'>): ContainerProps {
  return props
}

/**
 * The separator between the minimize and maximize buttons is less important
 * than the full title, but more important than a title that is truncated
 * anyway (as long as the title keeps its minimum width).
 */
function hasSeparator(remaining: number, naturalTitleWidth: number): boolean {
  if (remaining > naturalTitleWidth) {
    return true
  } else if (remaining === naturalTitleWidth) {
    return false
  }
  return (
    remaining - BUTTON_SEPARATOR_WIDTH >=
    Math.min(naturalTitleWidth, MIN_TITLE_WIDTH)
  )
}

function childWidth(child: View, available: Size): number {
  const {width} = child.naturalSize(available.withHeight(TITLE_BAR_HEIGHT))
  return Number.isFinite(width) ? width : 0
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function isButton(region: Region | undefined): region is WindowButton {
  return BUTTONS.includes(region as WindowButton)
}

function isEdge(region: Region): region is Edge {
  return !isButton(region) && region !== 'title' && region !== 'content'
}

interface WindowChars {
  topLeft: string
  topRight: string
  bottomLeft: string
  bottomRight: string
  horizontal: string
  vertical: string
  capLeft: string
  capRight: string
  closeRight: string
  highlightLeft: string
  highlightRight: string
  highlightVertical: string
}

const ACTIVE_CHARS: WindowChars = {
  topLeft: '╔',
  topRight: '╗',
  bottomLeft: '╚',
  bottomRight: '╝',
  horizontal: '═',
  vertical: '║',
  capLeft: '╡',
  capRight: '╞',
  closeRight: '│',
  highlightLeft: '╣',
  highlightRight: '╠',
  highlightVertical: '║',
}

const INACTIVE_CHARS: WindowChars = {
  topLeft: '╭',
  topRight: '╮',
  bottomLeft: '╰',
  bottomRight: '╯',
  horizontal: '─',
  vertical: '│',
  capLeft: '┤',
  capRight: '├',
  closeRight: '│',
  highlightLeft: '┫',
  highlightRight: '┣',
  highlightVertical: '┃',
}

const BUTTONS: readonly WindowButton[] = [
  'close',
  'minimize',
  'maximize',
  'restore',
]

const BUTTON_GLYPHS: Record<WindowButton, string> = {
  close: 'x',
  minimize: '-',
  maximize: '+',
  // without a variation selector, so that the button is 3 columns wide
  restore: '↔',
}

const UNBOUNDED = new Size(Infinity, 1)
const EMPTY_RECT = new Rect(Point.zero, Size.zero)
const TITLE_BAR_HEIGHT = 1
const BORDER_WIDTH = 2
const BORDER_HEIGHT = 2
const CORNERS_WIDTH = 2
const BUTTON_WIDTH = 3
const BUTTON_SEPARATOR_WIDTH = 1
const TITLE_PADDING_WIDTH = 2
const MIN_TITLE_WIDTH = 6
const MIN_HEIGHT = 2
// a minimized window is just its title bar
const MINIMIZED_HEIGHT = 1
