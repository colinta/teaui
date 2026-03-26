import type {Viewport} from '../Viewport.js'
import {type Props as ContainerProps, Container} from '../Container.js'
import {type Props as ViewProps, View} from '../View.js'
import {Point, Rect, Size, interpolate} from '../geometry.js'
import {isMouseWheel, type MouseEvent} from '../events/index.js'
import {Style} from '../Style.js'
import {type Orientation, type Direction} from './types.js'
import {Stack} from './Stack.js'

interface Props extends ContainerProps {
  /**
   * Layout direction for children. Scrollable manages an internal Stack,
   * so children are laid out in this direction.
   * @default 'down'
   */
  direction?: Direction
  /**
   * Gap between children (passed to internal Stack).
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

/**
 * Scrollable manages an internal Stack for layout and adds scroll offset,
 * scrollbar rendering, and mouse wheel handling on top.
 *
 * Children added to the Scrollable are delegated to the internal Stack.
 * Use `direction` to control layout (default: 'down'), or the static
 * constructors `Scrollable.down()`, `Scrollable.right()`, etc.
 */
export class Scrollable extends Container {
  #stack: Stack
  #scrollable: 'both' | 'horizontal' | 'vertical' = 'both'
  #showScrollbars: boolean | 'horizontal' | 'vertical' = true
  #scrollHeight: number = 1
  #scrollWidth: number = 2
  #keepAtBottom: boolean = false
  #isAtBottom: boolean = true
  #contentOffset: ContentOffset
  #contentSize: Size = Size.zero
  #contentSizeOverride?: {width?: number; height?: number}
  #visibleSize: Size = Size.zero
  #prevMouseDown?: Orientation = undefined
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
    super(props)

    this.#stack = new Stack({direction: direction ?? 'down', gap})
    // Add the Stack as the actual child of the Container
    super.add(this.#stack)

    this.#contentOffset = {x: 0, y: 0}
    this.#update(props)

    // Add user children to the internal Stack
    if (child) {
      this.#stack.add(child)
    }
    if (children) {
      for (const c of children) {
        this.#stack.add(c)
      }
    }
  }

  update({children, child, direction, gap, ...props}: Props) {
    this.#update(props)

    if (direction !== undefined) {
      this.#stack.direction = direction
    }
    if (gap !== undefined) {
      this.#stack.gap = gap
    }

    // Delegate child management to the internal Stack
    if (child !== undefined || children !== undefined) {
      const allChildren: View[] = []
      if (children) {
        allChildren.push(...children)
      }
      if (child) {
        allChildren.push(child)
      }

      this.#stack.update({
        direction: direction ?? this.#stack.direction,
        gap: gap ?? this.#stack.gap,
        children: allChildren,
      })
    }

    super.update(props)
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

  /**
   * Children are delegated to the internal Stack.
   */
  add(child: View, at?: number) {
    this.#stack.add(child, at)
  }

  removeChild(child: View) {
    this.#stack.removeChild(child)
  }

  removeAllChildren() {
    this.#stack.removeAllChildren()
  }

  /**
   * Returns the children of the internal Stack (the user's children),
   * not the Scrollable's direct children (which is just the Stack).
   */
  get children(): View[] {
    return this.#stack.children
  }

  naturalSize(available: Size): Size {
    const size = this.#stack.naturalSize(available).mutableCopy()
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
      const trackWidth = visibleWidth
      const maxOffsetX = Math.max(0, this.#contentSize.width - visibleWidth)
      const thumbWidth = this.#scrollbarThumbLength(
        trackWidth,
        visibleWidth,
        this.#contentSize.width,
      )
      const maxScrollbarX = Math.max(0, trackWidth - thumbWidth)
      const thumbX = Math.max(
        0,
        Math.min(maxScrollbarX, event.position.x - Math.floor(thumbWidth / 2)),
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
      const trackHeight = visibleHeight
      const maxOffsetY = Math.max(0, this.#contentSize.height - visibleHeight)
      const thumbHeight = this.#scrollbarThumbLength(
        trackHeight,
        visibleHeight,
        this.#contentSize.height,
      )
      const maxScrollbarY = Math.max(0, trackHeight - thumbHeight)
      const thumbY = Math.max(
        0,
        Math.min(maxScrollbarY, event.position.y - Math.floor(thumbHeight / 2)),
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

    const tooWide = this.#contentSize.width > this.contentSize.width
    const tooTall = this.#contentSize.height > this.contentSize.height

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
      foreground: this.theme.darkenColor,
      background: this.theme.darkenColor,
    })
  }

  #scrollbarThumbStyle(): Style {
    return new Style({
      foreground: this.theme.highlightColor,
      background: this.theme.highlightColor,
    })
  }

  #scrollbarThumbLength(
    trackLength: number,
    visibleLength: number,
    contentLength: number,
  ): number {
    const proportionalLength = Math.round(
      (visibleLength / contentLength) * trackLength,
    )
    const maxLength =
      contentLength > visibleLength ? trackLength - 1 : trackLength

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

  get contentSize(): Size {
    const deltaW = this.#showVerticalScrollbar() ? 1 : 0
    const deltaH = this.#showHorizontalScrollbar() ? 1 : 0
    return super.contentSize.shrink(deltaW, deltaH)
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
      const stackSize = this.#stack.naturalSize(viewport.contentSize)
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
      const maxY = this.#maxOffsetY()
      this.#contentOffset = {x: this.#contentOffset.x, y: maxY}
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

    // First clip to exclude scrollbar area — this ensures that the inner
    // viewport's visibleRect does not include the scrollbar column/row.
    // Without this, pinned children (which size to visibleRect) would
    // overlap the scrollbar.
    const scrollableArea = new Rect(
      Point.zero,
      new Size(visibleWidth, visibleHeight),
    )
    const outside = new Rect(
      [this.#contentOffset.x, this.#contentOffset.y],
      [
        Math.max(contentSize.width, visibleWidth),
        Math.max(contentSize.height, visibleHeight),
      ],
    )
    viewport.clipped(scrollableArea, contentViewport => {
      contentViewport.clipped(outside, inside => {
        this.#stack.render(inside)
      })
    })

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

      // scrollMaxX: x of the last column of the view
      // scrollMaxY: y of the last row of the view
      // scrollMaxHorizX: horizontal scroll bar is drawn from 0 to scrollMaxHorizX
      // scrollMaxHorizY: vertical scroll bar is drawn from 0 to scrollMaxHorizY
      const scrollMaxX = viewport.contentSize.width - 1,
        scrollMaxY = viewport.contentSize.height - 1,
        scrollMaxHorizX = scrollMaxX - (showVBar ? 1 : 0),
        scrollMaxVertY = scrollMaxY - (showHBar ? 1 : 0)
      if (showHBar && showVBar) {
        viewport.write('█', new Point(scrollMaxX, scrollMaxY), scrollBar)
      }

      if (showHBar) {
        viewport.registerMouse(
          'mouse.button.left',
          new Rect(new Point(0, scrollMaxY), new Size(scrollMaxHorizX + 1, 1)),
        )

        const trackWidth = scrollMaxHorizX + 1
        const maxOffsetX = Math.max(0, contentSize.width - visibleWidth)
        const thumbWidth = this.#scrollbarThumbLength(
          trackWidth,
          visibleWidth,
          contentSize.width,
        )
        const maxScrollbarX = Math.max(0, trackWidth - thumbWidth)
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
            new Point(x, scrollMaxY),
            inRange ? scrollControl : scrollBar,
          )
        }
      }

      if (showVBar) {
        viewport.registerMouse(
          'mouse.button.left',
          new Rect(new Point(scrollMaxX, 0), new Size(1, scrollMaxVertY + 1)),
        )

        const trackHeight = scrollMaxVertY + 1
        const maxOffsetY = Math.max(0, contentSize.height - visibleHeight)
        const thumbHeight = this.#scrollbarThumbLength(
          trackHeight,
          visibleHeight,
          contentSize.height,
        )
        const maxScrollbarY = Math.max(0, trackHeight - thumbHeight)
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
            new Point(scrollMaxX, y),
            inRange ? scrollControl : scrollBar,
          )
        }
      }
    }
  }
}
