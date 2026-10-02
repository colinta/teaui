import {Viewport} from '../Viewport.js'
import type {Props as ContainerProps} from '../Container.js'
import {Point, Rect, Size, interpolate} from '../geometry.js'
import {isMouseWheel, type MouseEvent} from '../events/index.js'
import {Style} from '../Style.js'
import {type Orientation, type Direction} from '../types.js'
import {View} from '../View.js'
import {Stack} from './Stack.js'

interface Props extends ContainerProps {
  /**
   * Layout direction for children.
   * @default 'down'
   */
  direction?: Direction
  /**
   * Gap between children.
   * @default 0
   */
  gap?: number
  /**
   * Which directions to allow scrolling.
   * @default 'both'
   */
  scrollable?: 'both' | 'horizontal' | 'vertical'
  /**
   * Show/hide the scrollbars. `true` shows both, `false` hides both, or
   * specify `'horizontal'` or `'vertical'` to show only one.
   * @default true
   */
  showScrollbars?: boolean | 'horizontal' | 'vertical'
  /**
   * When true, automatically scrolls to the bottom when content grows,
   * as long as the view was already at the bottom. Useful for log views.
   * @default false
   */
  keepAtBottom?: boolean
  /**
   * Override the content size. Useful for testing or when the content size
   * is known ahead of time. When not provided, the content size is computed
   * from the children's naturalSize.
   */
  contentSize?: {width?: number; height?: number}
  /**
   * The current scroll offset. Use with `onOffsetChange` for controlled scrolling.
   */
  offset?: Point
  /**
   * Callback when the scroll offset changes.
   */
  onOffsetChange?: (offset: Point) => void
}

type ShorthandProps = NonNullable<Props['children']> | Omit<Props, 'direction'>

function fromShorthand(
  props: ShorthandProps,
  direction: Direction,
  extraProps: Omit<Props, 'children' | 'direction'> = {},
): Props {
  if (Array.isArray(props)) {
    return {children: props, direction, ...extraProps}
  } else {
    return {...props, direction, ...extraProps}
  }
}

interface ContentOffset {
  x: number
  y: number
}

/** One axis of a `scrollTo` target, in content coordinates. */
interface RevealAxis {
  location: number
  length: number
  offset: number
  viewportLength: number
}

/**
 * Scrollable uses Stack layout and adds scroll offset, scrollbar rendering,
 * and mouse wheel handling on top.
 *
 * Use `direction` to control layout (default: 'down'), or the static
 * constructors `Scrollable.down()`, `Scrollable.right()`, etc.
 */
export class Scrollable extends Stack {
  #scrollable: 'both' | 'horizontal' | 'vertical' = 'both'
  #showScrollbars: boolean | 'horizontal' | 'vertical' = true
  #scrollHeight: number = 1
  #scrollWidth: number = 2
  #keepAtBottom: boolean = false
  #isAtBottom: boolean = true
  #contentOffset: ContentOffset
  #contentSize: Size = Size.zero
  #contentSizeOverride?: {width?: number; height?: number}
  #viewportSize: Size = Size.zero
  #visibleSize: Size = Size.zero
  #prevMouseDown?: Orientation = undefined
  #isReflowing = false
  #onOffsetChange?: (offset: Point) => void

  static down(
    props: ShorthandProps = {},
    extraProps: Omit<Props, 'children' | 'direction'> = {},
  ): Scrollable {
    return new Scrollable(fromShorthand(props, 'down', extraProps))
  }

  static up(
    props: ShorthandProps = {},
    extraProps: Omit<Props, 'children' | 'direction'> = {},
  ): Scrollable {
    return new Scrollable(fromShorthand(props, 'up', extraProps))
  }

  static right(
    props: ShorthandProps = {},
    extraProps: Omit<Props, 'children' | 'direction'> = {},
  ): Scrollable {
    return new Scrollable(fromShorthand(props, 'right', extraProps))
  }

  static left(
    props: ShorthandProps = {},
    extraProps: Omit<Props, 'children' | 'direction'> = {},
  ): Scrollable {
    return new Scrollable(fromShorthand(props, 'left', extraProps))
  }

  constructor({children, child, direction, gap, ...props}: Props) {
    super({children, child, direction: direction ?? 'down', gap, ...props})

    this.#contentOffset = {x: 0, y: 0}
    this.#update(props)
  }

  update({children, child, direction, gap, ...props}: Props) {
    this.#update(props)
    super.update({
      children,
      child,
      direction: direction ?? this.direction,
      gap: gap ?? this.gap,
      ...props,
    })
  }

  #update({
    scrollable,
    showScrollbars,
    keepAtBottom,
    contentSize: contentSizeOverride,
    offset,
    onOffsetChange,
  }: Props) {
    this.#scrollable = scrollable ?? 'both'
    this.#showScrollbars = showScrollbars ?? true
    this.#keepAtBottom = keepAtBottom ?? false
    this.#contentSizeOverride = contentSizeOverride
    this.#onOffsetChange = onOffsetChange
    if (offset) {
      this.#contentOffset = {x: -offset.x, y: -offset.y}
    }
  }

  naturalSize(available: Size): Size {
    const size = super.naturalSize(available).mutableCopy()
    size.width = Math.min(size.width, available.width)
    size.height = Math.min(size.height, available.height)
    return size
  }

  #maxOffsetX() {
    const tooTall = this.#contentSize.height > this.contentSize.height

    return this.#visibleSize.width - this.#contentSize.width + (tooTall ? 0 : 1)
  }

  #maxOffsetY() {
    const tooWide = this.#contentSize.width > this.contentSize.width

    return (
      this.#visibleSize.height - this.#contentSize.height + (tooWide ? 0 : 1)
    )
  }

  receiveMouse(event: MouseEvent) {
    if (isMouseWheel(event)) {
      this.receiveWheel(event)
      return
    }

    if (event.name === 'mouse.button.up') {
      this.#prevMouseDown = undefined
      return
    }

    const tooWide = this.#contentSize.width > this.contentSize.width
    const tooTall = this.#contentSize.height > this.contentSize.height

    if (
      tooWide &&
      tooTall &&
      event.position.y === this.contentSize.height - 1 &&
      event.position.x === this.contentSize.width - 1
    ) {
      // bottom-right corner click
      return
    }

    if (this.#prevMouseDown === undefined) {
      if (tooWide && event.position.y === this.contentSize.height) {
        this.#prevMouseDown = 'horizontal'
      } else if (tooTall && event.position.x === this.contentSize.width) {
        this.#prevMouseDown = 'vertical'
      } else {
        return
      }
    }

    this.receiveMouseDown(event)
  }

  receiveMouseDown(event: MouseEvent) {
    const tooWide = this.#contentSize.width > this.contentSize.width
    const tooTall = this.#contentSize.height > this.contentSize.height
    const showVBar = this.#showVerticalScrollbar() && tooTall
    const showHBar = this.#showHorizontalScrollbar() && tooWide
    const visibleWidth = this.contentSize.width - (showVBar ? 1 : 0)
    const visibleHeight = this.contentSize.height - (showHBar ? 1 : 0)

    if (tooWide && this.#prevMouseDown === 'horizontal') {
      const maxOffsetX = Math.max(0, this.#contentSize.width - visibleWidth - 1)
      const thumbWidth = this.#scrollbarThumbLength(
        visibleWidth,
        this.#contentSize.width,
      )
      const maxScrollbarX = Math.max(0, visibleWidth - thumbWidth)
      const thumbX = Math.max(
        0,
        Math.min(
          maxScrollbarX,
          event.position.x -
            interpolate(event.position.x, [0, visibleWidth], [0, thumbWidth]),
        ),
      )
      const offsetX = this.#scrollbarThumbPosition(
        thumbX,
        maxScrollbarX,
        maxOffsetX,
      )
      this.#contentOffset = {
        x: -offsetX,
        y: this.#contentOffset.y,
      }
    } else if (tooTall && this.#prevMouseDown === 'vertical') {
      const maxOffsetY = Math.max(
        0,
        this.#contentSize.height - visibleHeight - 1,
      )
      const thumbHeight = this.#scrollbarThumbLength(
        visibleHeight,
        this.#contentSize.height,
      )
      const maxScrollbarY = Math.max(0, visibleHeight - thumbHeight)
      const thumbY = Math.max(
        0,
        Math.min(
          maxScrollbarY,
          event.position.y -
            interpolate(event.position.y, [0, visibleHeight], [0, thumbHeight]),
        ),
      )
      const offsetY = this.#scrollbarThumbPosition(
        thumbY,
        maxScrollbarY,
        maxOffsetY,
      )
      const y = -offsetY
      this.#contentOffset = {
        x: this.#contentOffset.x,
        y,
      }
      this.#isAtBottom = y <= this.#maxOffsetY()
    }
  }

  receiveWheel(event: MouseEvent) {
    let deltaY = 0,
      deltaX = 0
    if (event.name === 'mouse.wheel.up') {
      deltaY = this.#scrollHeight * -1
    } else if (event.name === 'mouse.wheel.down') {
      deltaY = this.#scrollHeight
    } else if (event.name === 'mouse.wheel.left') {
      deltaX = this.#scrollWidth
    } else if (event.name === 'mouse.wheel.right') {
      deltaX = this.#scrollWidth * -1
    }

    if (event.ctrl) {
      deltaY *= 5
      deltaX *= 5
    }

    const tooTall = (this.#contentSize?.height ?? 0) > this.contentSize.height
    if (!tooTall && deltaX === 0) {
      deltaX = deltaY
    }

    this.scrollBy(deltaX, deltaY)
  }

  /**
   * Moves the visible region. The visible region is stored as a pointer to the
   * top-most row and an offset from the top of that row (see `interface ContentOffset`)
   *
   * Positive offset scrolls *down* (currentOffset goes more negative)
   *
   * When current cell is entirely above the top, we set the `contentOffset` to the
   * row that is at the top of the screen and still visible, similarly if the current
   * cell is below the top, we fetch enough rows about and update the `contentOffset`
   * to point to the top-most row.
   */
  scrollBy(offsetX: number, offsetY: number) {
    if (offsetX === 0 && offsetY === 0) {
      return
    }

    // Restrict scrolling to allowed direction(s)
    if (this.#scrollable === 'horizontal') {
      offsetY = 0
    } else if (this.#scrollable === 'vertical') {
      offsetX = 0
    }

    if (offsetX === 0 && offsetY === 0) {
      return
    }

    let {x, y} = this.#contentOffset
    const maxX = this.#maxOffsetX()
    const maxY = this.#maxOffsetY()
    x = Math.min(0, Math.max(maxX, x - offsetX))
    y = Math.min(0, Math.max(maxY, y - offsetY))
    this.#contentOffset = {x, y}

    // Track whether we're at the bottom (for keepAtBottom)
    this.#isAtBottom = y <= maxY

    this.#onOffsetChange?.(new Point(-x || 0, -y || 0))
  }

  /**
   * Scrolls to reveal the target. Each axis is handled independently: if any
   * part of the target is already visible on an axis, that axis' offset is left
   * alone. Otherwise, on that axis, the entire target is
   * made visible when it fits, and a target larger than the viewport is aligned
   * to the top (or left) - scrolling as little as possible.
   *
   * - `scrollTo({x, y})` reveals the given content coordinate(s); an omitted
   *   coordinate leaves that axis alone.
   * - `scrollTo(view)` reveals a descendant view on both axes. Views outside
   *   this Scrollable are ignored.
   *
   * Axes disallowed by the `scrollable` prop are never moved (and don't count
   * towards visibility), and offsets are clamped to the scrollable range.
   * Descendant locations and sizes come from their last render. Offscreen
   * children are not laid out during render, so if `view` is inside one, a
   * layout pass (see `#reflow`) is run first.
   */
  scrollTo(target: View | {x?: number; y?: number}) {
    let location: {x?: number; y?: number}
    let size = new Size(1, 1)
    if (target instanceof View) {
      if (this.#isInOffscreenChild(target)) {
        this.#reflow()
      }

      const point = this.#locationOf(target)
      if (!point) {
        return
      }
      location = point
      size = target.contentSize
    } else {
      location = target
    }

    const xAxis =
      location.x !== undefined && this.#scrollable !== 'vertical'
        ? {
            location: location.x,
            length: size.width,
            offset: -this.#contentOffset.x,
            viewportLength: this.#viewportSize.width,
          }
        : undefined
    const yAxis =
      location.y !== undefined && this.#scrollable !== 'horizontal'
        ? {
            location: location.y,
            length: size.height,
            offset: -this.#contentOffset.y,
            viewportLength: this.#viewportSize.height,
          }
        : undefined
    if (!xAxis && !yAxis) {
      return
    }

    let {x, y} = this.#contentOffset
    if (xAxis && !this.#isRangeVisible(xAxis)) {
      x = -this.#offsetToReveal(xAxis, -this.#maxOffsetX())
    }
    if (yAxis && !this.#isRangeVisible(yAxis)) {
      y = -this.#offsetToReveal(yAxis, -this.#maxOffsetY())
    }
    if (x === this.#contentOffset.x && y === this.#contentOffset.y) {
      return
    }

    this.#contentOffset = {x, y}
    this.#isAtBottom = y <= this.#maxOffsetY()
    this.invalidateRender()
    this.#onOffsetChange?.(new Point(-x || 0, -y || 0))
  }

  #isRangeVisible({location, length, offset, viewportLength}: RevealAxis) {
    const end = location + Math.max(1, length)
    return end > offset && location < offset + viewportLength
  }

  /**
   * Returns the (positive) offset along one axis that reveals the range,
   * moving as little as possible from the current offset.
   */
  #offsetToReveal(
    {location, length, offset, viewportLength}: RevealAxis,
    maxOffset: number,
  ) {
    let next = offset
    if (viewportLength > 0) {
      const end = location + Math.max(1, length)
      if (length > viewportLength || location < offset) {
        next = location
      } else if (end > offset + viewportLength) {
        next = end - viewportLength
      }
    }
    return Math.max(0, Math.min(Math.max(0, maxOffset), next))
  }

  /**
   * Sum of `location` from `view` up to (and including) this
   * Scrollable's child.
   */
  #locationOf(view: View): Point | undefined {
    let x = 0
    let y = 0
    let current: View = view
    while (current !== this) {
      if (!current.parent) {
        return undefined
      }
      x += current.origin.x
      y += current.origin.y
      current = current.parent
    }
    return new Point(x, y)
  }

  /**
   * Whether `view` is (or is inside) a child that was rendered offscreen
   * during the last render.
   */
  #isInOffscreenChild(view: View): boolean {
    let current: View = view
    while (current.parent && current.parent !== this) {
      current = current.parent
    }
    return current.parent === this && this.isOffscreenChild(current)
  }

  /**
   * Lays out all children - including offscreen children - using the sizes
   * from the last render, without drawing or registering events. This updates
   * the `origin` and `contentSize` of all descendants.
   */
  #reflow() {
    const screen = this.screen
    if (!screen) {
      return
    }

    const viewport = Viewport.layout(screen, super.contentSize)
    this.#isReflowing = true
    try {
      this.#renderContent(viewport)
    } finally {
      this.#isReflowing = false
    }
  }

  #showHorizontalScrollbar(): boolean {
    return (
      this.#showScrollbars === true || this.#showScrollbars === 'horizontal'
    )
  }

  #showVerticalScrollbar(): boolean {
    return this.#showScrollbars === true || this.#showScrollbars === 'vertical'
  }

  #scrollbarStyle(): Style {
    return new Style({
      foreground: this.purpose.pressedBackgroundColor,
      background: this.purpose.pressedBackgroundColor,
    })
  }

  #scrollbarThumbStyle(): Style {
    return new Style({
      foreground: this.purpose.hoverBackgroundColor,
      background: this.purpose.hoverBackgroundColor,
    })
  }

  #scrollbarThumbLength(visibleLength: number, contentLength: number): number {
    const proportionalLength = Math.round(
      (visibleLength / contentLength) * visibleLength,
    )
    const maxLength =
      contentLength > visibleLength ? visibleLength - 1 : visibleLength

    return Math.max(1, Math.min(maxLength, proportionalLength))
  }

  #scrollbarThumbPosition(
    contentOffset: number,
    maxContentOffset: number,
    maxScrollbarOffset: number,
  ): number {
    return Math.round(
      interpolate(
        contentOffset,
        [0, maxContentOffset],
        [0, maxScrollbarOffset],
        true,
      ),
    )
  }

  protected get skipsOffscreenChildren() {
    return !this.#isReflowing
  }

  get contentSize(): Size {
    const deltaW = this.#showVerticalScrollbar() ? 1 : 0
    const deltaH = this.#showHorizontalScrollbar() ? 1 : 0
    return super.contentSize.shrink(deltaW, deltaH)
  }

  /**
   * Renders the children, offset by #contentOffset, using #contentSize and
   * #viewportSize (from `render()`).
   */
  #renderContent(viewport: Viewport) {
    // First clip to exclude scrollbar area — this ensures that the inner
    // viewport's visibleRect does not include the scrollbar column/row.
    // Without this, pinned children (which size to visibleRect) would
    // overlap the scrollbar.
    const scrollableArea = new Rect(Point.zero, this.#viewportSize)
    const outside = new Rect(
      [this.#contentOffset.x, this.#contentOffset.y],
      [
        Math.max(this.#contentSize.width, this.#viewportSize.width),
        Math.max(this.#contentSize.height, this.#viewportSize.height),
      ],
    )
    viewport.clipped(scrollableArea, contentViewport => {
      contentViewport.clipped(outside, inside => {
        inside.resetLocationOrigin()
        super.render(inside)
      })
    })
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return super.render(viewport)
    }

    viewport.registerMouse('mouse.wheel')

    let contentSize = Size.zero.mutableCopy()
    if (this.#contentSizeOverride) {
      contentSize.width =
        this.#contentSizeOverride.width ?? viewport.contentSize.width
      contentSize.height =
        this.#contentSizeOverride.height ?? viewport.contentSize.height
    } else {
      const stackSize = super.naturalSize(viewport.contentSize)
      contentSize.width = stackSize.width
      contentSize.height = stackSize.height
    }
    this.#contentSize = contentSize

    const canScrollHoriz = this.#scrollable !== 'vertical'
    const canScrollVert = this.#scrollable !== 'horizontal'
    const tooWide =
      canScrollHoriz && contentSize.width > viewport.contentSize.width
    const tooTall =
      canScrollVert && contentSize.height > viewport.contentSize.height

    // keepAtBottom: snap to end when content grows and we were at the bottom
    if (this.#keepAtBottom && this.#isAtBottom && tooTall) {
      // Use this render's visible height: #visibleSize is only set at the end of
      // render, so on the first render it is still zero and the content would
      // scroll up by its whole height (a blank viewport).
      const maxY =
        viewport.visibleRect.size.height -
        1 -
        contentSize.height +
        (tooWide ? 0 : 1)
      this.#contentOffset = {x: this.#contentOffset.x, y: Math.min(0, maxY)}
    }

    const showVBar = this.#showVerticalScrollbar() && tooTall
    const showHBar = this.#showHorizontalScrollbar() && tooWide

    // #contentOffset is _negative_ (indicates the amount to move the view away
    // from the origin, which will always be up/left of 0,0)
    // Children are laid out in a region that is at least as wide/tall as the
    // content, and at least as wide/tall as the viewport (minus scrollbars).
    // This ensures flex children expand to fill the visible area, while
    // children that overflow extend beyond it.
    const visibleWidth = viewport.contentSize.width - (showVBar ? 1 : 0)
    const visibleHeight = viewport.contentSize.height - (showHBar ? 1 : 0)
    this.#viewportSize = new Size(visibleWidth, visibleHeight)

    this.#renderContent(viewport)

    // Note: #visibleSize is used in #maxOffsetX/#maxOffsetY calculations.
    // The formula requires shrinking by overflow status (not scrollbar visibility)
    // because the +1 correction in the offset formulas compensates for this.
    this.#visibleSize = viewport.visibleRect.size.shrink(
      tooWide ? 1 : 0,
      tooTall ? 1 : 0,
    )

    if (showVBar || showHBar) {
      const scrollBar = this.#scrollbarStyle()
      const scrollControl = this.#scrollbarThumbStyle()

      // vertScrollX: X position where the vertical scrollbar is drawn
      // horizScrollY: Y position where the horizontal scrollbar is drawn
      // scrollMaxHorizX: horizontal scroll bar is drawn from 0 to scrollMaxHorizX
      // scrollMaxHorizY: vertical scroll bar is drawn from 0 to scrollMaxHorizY
      const vertScrollX = viewport.contentSize.width - 1,
        horizScrollY = viewport.contentSize.height - 1,
        scrollMaxHorizX = vertScrollX - (showVBar ? 1 : 0),
        scrollMaxVertY = horizScrollY - (showHBar ? 1 : 0)
      if (showHBar && showVBar) {
        viewport.write('█', new Point(vertScrollX, horizScrollY), scrollBar)
      }

      if (showHBar) {
        viewport.registerMouse(
          'mouse.button.left',
          new Rect(new Point(0, horizScrollY), new Size(visibleWidth, 1)),
        )

        const maxOffsetX = Math.max(0, contentSize.width - visibleWidth)
        const thumbWidth = this.#scrollbarThumbLength(
          visibleWidth,
          contentSize.width,
        )
        const maxScrollbarX = Math.max(0, visibleWidth - thumbWidth)
        const contentOffsetX = -this.#contentOffset.x
        const viewX = this.#scrollbarThumbPosition(
          contentOffsetX,
          maxOffsetX,
          maxScrollbarX,
        )
        for (let x = 0; x <= scrollMaxHorizX; x++) {
          const inRange = x >= viewX && x < viewX + thumbWidth
          viewport.write(
            inRange ? '█' : ' ',
            new Point(x, horizScrollY),
            inRange ? scrollControl : scrollBar,
          )
        }
      }

      if (showVBar) {
        viewport.registerMouse(
          'mouse.button.left',
          new Rect(new Point(vertScrollX, 0), new Size(1, visibleHeight)),
        )

        const maxOffsetY = Math.max(0, contentSize.height - visibleHeight)
        const thumbHeight = this.#scrollbarThumbLength(
          visibleHeight,
          contentSize.height,
        )
        const maxScrollbarY = Math.max(0, visibleHeight - thumbHeight)
        const contentOffsetY = -this.#contentOffset.y
        const viewY = this.#scrollbarThumbPosition(
          contentOffsetY,
          maxOffsetY,
          maxScrollbarY,
        )
        for (let y = 0; y <= scrollMaxVertY; y++) {
          const inRange = y >= viewY && y < viewY + thumbHeight
          viewport.write(
            inRange ? '█' : ' ',
            new Point(vertScrollX, y),
            inRange ? scrollControl : scrollBar,
          )
        }
      }
    }
  }
}
