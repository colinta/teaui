import type {Viewport} from '../Viewport.js'
import {type Props as ViewProps, View, parseFlexShorthand} from '../View.js'
import type {FlexShorthand, FlexSize} from '../View.js'
import {Container} from '../Container.js'
import {Rect, Point, Size, MutablePoint} from '../geometry.js'
import {define} from '../util.js'
import {type Direction} from '../types.js'

interface Props extends ViewProps {
  children?: ([FlexShorthand, View] | View)[]
  child?: [FlexShorthand, View] | View
  direction?: Direction
  fill?: boolean
  gap?: number
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

export class Stack extends Container {
  #direction: Direction = 'down'
  #gap: number = 0
  #fill: boolean = true
  #sizes: Map<View, FlexSize> = new Map()
  #offscreenChildren: Set<View> = new Set()

  static down(
    props: ShorthandProps = {},
    extraProps: Omit<Props, 'children' | 'direction'> = {},
  ): Stack {
    const direction: Direction = 'down'
    return new Stack(fromShorthand(props, direction, extraProps))
  }

  static up(
    props: ShorthandProps = {},
    extraProps: Omit<Props, 'children' | 'direction'> = {},
  ): Stack {
    const direction: Direction = 'up'
    return new Stack(fromShorthand(props, direction, extraProps))
  }

  static right(
    props: ShorthandProps = {},
    extraProps: Omit<Props, 'children' | 'direction'> = {},
  ): Stack {
    const direction: Direction = 'right'
    return new Stack(fromShorthand(props, direction, extraProps))
  }

  static left(
    props: ShorthandProps = {},
    extraProps: Omit<Props, 'children' | 'direction'> = {},
  ): Stack {
    const direction: Direction = 'left'
    return new Stack(fromShorthand(props, direction, extraProps))
  }

  constructor({children, child, direction, fill, gap, ...viewProps}: Props) {
    super(viewProps)

    define(this, 'direction', {enumerable: true})
    define(this, 'gap', {enumerable: true})

    this.#update({direction, fill, gap})
    this.#updateChildren(children, child)
  }

  get direction() {
    return this.#direction
  }

  set direction(value: Direction) {
    this.#direction = value
    this.invalidateSize()
  }

  get gap() {
    return this.#gap
  }

  set gap(value: number) {
    this.#gap = value
    this.invalidateSize()
  }

  update({children, child, ...props}: Props) {
    this.#update(props)
    this.#updateChildren(children, child)
    super.update(props)
  }

  #updateChildren(children: Props['children'], child: Props['child']) {
    // this logic comes from Container
    if (child !== undefined) {
      children = (children ?? []).concat([child])
    }

    if (children === undefined) {
      return
    }

    if (children.length) {
      const childrenSet = new Set(children)
      for (const child of this.children) {
        if (!childrenSet.has(child)) {
          this.removeChild(child)
        }
      }

      for (const info of children) {
        let flexSize: FlexShorthand, child: View
        if (info instanceof View) {
          flexSize = info.flex
          child = info
        } else {
          ;[flexSize, child] = info

          flexSize = parseFlexShorthand(flexSize)
        }

        this.addFlex(flexSize, child)
      }
    } else {
      this.removeAllChildren()
    }
  }

  #update({direction, fill, gap}: Props) {
    this.#direction = direction ?? 'down'
    this.#fill = fill ?? true
    this.#gap = gap ?? 0
  }

  naturalSize(available: Size): Size {
    const size = Size.zero.mutableCopy()
    const remainingSize = available.mutableCopy()
    let hasFlex = false
    for (const child of this.children) {
      // layout markers are flow-neutral: no size, and no gap
      if (!child.isVisible || child.isLayoutMarker) {
        continue
      }
      const childSize = child.naturalSize(remainingSize)

      if (this.isVertical) {
        if (size.height) {
          size.height += this.#gap
        }

        remainingSize.height = Math.max(
          0,
          remainingSize.height - childSize.height,
        )
        size.width = Math.max(size.width, childSize.width)
        size.height += childSize.height
      } else {
        if (size.width) {
          size.width += this.#gap
        }

        remainingSize.width = Math.max(0, remainingSize.width - childSize.width)
        size.width += childSize.width
        size.height = Math.max(size.height, childSize.height)
      }

      const flexSize = this.#sizes.get(child)
      if (flexSize && flexSize !== 'natural') {
        hasFlex = true
      }
    }

    if (hasFlex && this.#fill) {
      if (this.isVertical) {
        const height = Math.max(size.height, available.height)
        return new Size(size.width, height)
      } else {
        const width = Math.max(size.width, available.width)
        return new Size(width, size.height)
      }
    }

    return size
  }

  add(child: View, at?: number) {
    super.add(child, at)
    this.#sizes.set(child, child.flex)
  }

  addFlex(flexSize: FlexSize, child: View, at?: number) {
    super.add(child, at)
    this.#sizes.set(child, flexSize)
  }

  get isVertical() {
    return this.#direction === 'down' || this.#direction === 'up'
  }

  /**
   * When true, children that are entirely outside of the visible rect (and do
   * not contain the focused view) are rendered into an empty viewport, which
   * registers focus/hotkeys but skips layout and drawing. Scrollable enables
   * this.
   */
  protected get skipsOffscreenChildren() {
    return false
  }

  /**
   * Whether `child` was rendered offscreen (into an empty viewport) during the
   * last render, in which case its layout is out of date.
   */
  protected isOffscreenChild(child: View) {
    return this.#offscreenChildren.has(child)
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return super.render(viewport)
    }

    const remainingSize = viewport.contentSize.mutableCopy()

    let flexTotal = 0
    let flexCount = 0
    // first pass, calculate all the naturalSizes and subtract them from the
    // contentSize - leftovers are divided to the flex views. naturalSizes might
    // as well be memoized along with the flex amounts
    const flexViews: [FlexSize, number, View][] = []
    // Layout markers don't take up space (or gaps); they are rendered at the
    // flow position in front of `flexViews[index]`, or after the last view.
    const markers: [index: number, marker: View][] = []
    for (const child of this.children) {
      if (!child.isVisible) {
        continue
      }

      if (child.isLayoutMarker) {
        markers.push([flexViews.length, child])
        continue
      }

      if (flexViews.length) {
        if (this.isVertical) {
          remainingSize.height = Math.max(0, remainingSize.height - this.#gap)
        } else {
          remainingSize.width = Math.max(0, remainingSize.width - this.#gap)
        }
      }

      const flexSize = this.#sizes.get(child) ?? 'natural'
      if (flexSize === 'natural') {
        // For pinned children, use the visible rect size in the pinned
        // dimension so naturalSize computes based on visible area.
        let availableForChild = remainingSize
        if (child.pin === 'horizontal' && this.isVertical) {
          availableForChild = remainingSize.mutableCopy()
          availableForChild.width = viewport.visibleRect.size.width
        } else if (child.pin === 'vertical' && !this.isVertical) {
          availableForChild = remainingSize.mutableCopy()
          availableForChild.height = viewport.visibleRect.size.height
        }
        const childSize = child.naturalSize(availableForChild)

        if (this.isVertical) {
          flexViews.push(['natural', childSize.height, child])
          remainingSize.height -= childSize.height
        } else {
          flexViews.push(['natural', childSize.width, child])
          remainingSize.width -= childSize.width
        }

        remainingSize.height = Math.max(0, remainingSize.height)
        remainingSize.width = Math.max(0, remainingSize.width)
      } else {
        flexTotal += flexSize
        flexViews.push([flexSize, flexSize, child])
        flexCount += 1
      }
    }

    let origin: MutablePoint
    switch (this.#direction) {
      case 'right':
      case 'down':
        origin = Point.zero.mutableCopy()
        break
      case 'left':
        origin = new Point(viewport.contentSize.width, 0)
        break
      case 'up':
        origin = new Point(0, viewport.contentSize.height)
        break
    }

    const focusView = this.skipsOffscreenChildren
      ? this.screen?.currentFocusView
      : undefined
    this.#offscreenChildren.clear()

    // stores the leftover rounding errors, and added to view once it exceeds 1
    let correctAmount: number = 0

    let markerIndex = 0
    const renderMarkers = (index: number) => {
      while (
        markerIndex < markers.length &&
        markers[markerIndex][0] === index
      ) {
        const marker = markers[markerIndex++][1]
        viewport.clipped(new Rect(origin.copy(), Size.zero), inside => {
          marker.render(inside)
        })
      }
    }

    // second pass, divide up the remainingSize to the flex views, subtracting off
    // of remainingSize. The last view receives any leftover height
    const totalRemainingSize = this.isVertical
      ? remainingSize.height
      : remainingSize.width
    let remainingDimension = totalRemainingSize
    let isFirst = true
    for (const [index, [flexSize, amount, child]] of flexViews.entries()) {
      const childSize = viewport.contentSize.mutableCopy()

      // For pinned children, use the visible rect size in the pinned dimension
      if (child.pin === 'horizontal' && this.isVertical) {
        childSize.width = viewport.visibleRect.size.width
      } else if (child.pin === 'vertical' && !this.isVertical) {
        childSize.height = viewport.visibleRect.size.height
      }

      if (!isFirst) {
        remainingDimension -= this.#gap
      }

      if (flexSize === 'natural') {
        if (this.isVertical) {
          childSize.height = amount
        } else {
          childSize.width = amount
        }
      } else {
        // rounding errors can compound, so we track the error and add it to subsequent
        // views; the last view receives the amount left in remainingSize (0..1)
        let size = (totalRemainingSize / flexTotal) * amount + correctAmount
        correctAmount = size - ~~size
        remainingDimension -= ~~size

        // --flexCount === 0 checks for the last flex view
        if (--flexCount === 0) {
          size += remainingDimension
        }

        if (this.isVertical) {
          childSize.height = ~~size
        } else {
          childSize.width = ~~size
        }
      }

      if (!isFirst) {
        if (this.#direction === 'right') {
          origin.x += this.#gap
        } else if (this.#direction === 'down') {
          origin.y += this.#gap
        } else if (this.#direction === 'left') {
          origin.x -= this.#gap
        } else {
          origin.y -= this.#gap
        }
      }

      // origin is now the leading edge (in the stack direction) of `child`
      renderMarkers(index)

      if (this.#direction === 'left') {
        origin.x -= childSize.width
      } else if (this.#direction === 'up') {
        origin.y -= childSize.height
      }

      const clipOrigin = origin.mutableCopy()
      const clipSize = childSize.mutableCopy()

      // Pin support: if a child is pinned in the cross-axis direction,
      // use the visible rect dimensions instead of the content dimensions.
      // This makes the child stay fixed in that axis while scrolling.
      if (child.pin === 'horizontal' && this.isVertical) {
        clipSize.width = viewport.visibleRect.size.width
        clipOrigin.x = viewport.visibleRect.origin.x
      } else if (child.pin === 'vertical' && !this.isVertical) {
        clipSize.height = viewport.visibleRect.size.height
        clipOrigin.y = viewport.visibleRect.origin.y
      }

      // Offscreen children are rendered into an empty viewport, so that they
      // still register focus/hotkeys, but skip layout and drawing.
      if (
        this.skipsOffscreenChildren &&
        isOffscreen(new Rect(clipOrigin, clipSize), viewport.visibleRect) &&
        !containsView(child, focusView)
      ) {
        this.#offscreenChildren.add(child)
        clipSize.width = 0
        clipSize.height = 0
      }

      viewport.clipped(new Rect(clipOrigin, clipSize), inside => {
        child.render(inside)
      })

      if (this.#direction === 'right') {
        origin.x += childSize.width
      } else if (this.#direction === 'down') {
        origin.y += childSize.height
      }

      isFirst = false
    }

    // trailing markers: the trailing edge of the last view (no trailing gap)
    renderMarkers(flexViews.length)
  }
}

/**
 * Whether `rect` lies entirely outside of `visibleRect`. Empty rects are never
 * considered offscreen - they are cheap to render, and often need to register
 * hotkeys/focus (e.g. a collapsed Collapsible).
 */
function isOffscreen(rect: Rect, visibleRect: Rect) {
  if (rect.size.width <= 0 || rect.size.height <= 0) {
    return false
  }

  return (
    rect.maxX() <= visibleRect.minX() ||
    rect.minX() >= visibleRect.maxX() ||
    rect.maxY() <= visibleRect.minY() ||
    rect.minY() >= visibleRect.maxY()
  )
}

/**
 * Whether `view` is `ancestor`, or one of its descendants.
 */
function containsView(ancestor: View, view: View | undefined) {
  let current = view
  while (current) {
    if (current === ancestor) {
      return true
    }
    current = current.parent
  }
  return false
}
