import type {Viewport} from '../Viewport.js'
import {type Props as ViewProps, View} from '../View.js'
import {Container} from '../Container.js'
import {Style} from '../Style.js'
import {Rect, Point, Size, interpolate} from '../geometry.js'
import {type MouseEvent, isMouseDragging} from '../events/index.js'

interface Props<T> extends ViewProps {
  items: T[]
  renderItem: (item: T, row: number) => View
  /**
   * Show/hide the scrollbars
   * @default true
   */
  showScrollbars?: boolean
  /**
   * Useful for log views
   */
  keepAtBottom?: boolean
}

interface ContentOffset {
  row: number
  offset: number
}

export class ScrollableList<T> extends Container {
  #items: T[]
  /**
   * Your renderItem function need not return "stable" views; the views returned by
   * this function will be cached until you call `scrollableList.invalidateCache()`
   * or `scrollableList.invalidateRow(row)`.
   */
  #renderItem: Props<T>['renderItem']
  #keepAtBottom: boolean
  #isAtBottom = true
  #showScrollbars: boolean
  #scrollHeight: number = 1

  #contentOffset: ContentOffset
  #maxWidth: number = 0
  #viewCache: Map<T, View> = new Map()
  #sizeCache: Map<T, Size> = new Map()
  #totalHeight?: number

  constructor({
    renderItem,
    items,
    keepAtBottom,
    showScrollbars,
    ...viewProps
  }: Props<T>) {
    super(viewProps)
    this.#showScrollbars = showScrollbars ?? true
    this.#contentOffset = {row: 0, offset: 0}
    this.#renderItem = renderItem
    this.#items = items
    this.#keepAtBottom = keepAtBottom ?? false
  }

  update(props: Props<T>) {
    this.#update(props)
    super.update(props)
  }

  #update({}: Props<T>) {}

  naturalSize(available: Size): Size {
    let {row, offset: y} = this.#contentOffset
    const scrollWidth = this.#showScrollbars ? 1 : 0

    while (y < available.height) {
      const view = this.viewForRow(row)
      if (!view) {
        break
      }

      const rowSize = this.sizeForRow(row, available.width - scrollWidth, view)
      // persist #maxWidth so that the largest row _remains_ the largest row even
      // after it scrolls out of the visible window
      this.#maxWidth = Math.max(this.#maxWidth, rowSize.width)
      y += rowSize.height
      row += 1
    }

    return new Size(this.#maxWidth + scrollWidth, Math.min(y, available.height))
  }

  /**
   * Tells ScrollableList to re-fetch all rows.
   */
  invalidate() {
    this.#maxWidth = 0
    this.invalidateAllRows('view')
    super.invalidateSize()
  }

  /**
   * Tells ScrollableList to re-fetch the visible rows.
   * @param forCache: 'size' | 'view' representing which cache to invalidate
   */
  invalidateAllRows(forCache: 'size' | 'view') {
    if (forCache === 'view') {
      this.#viewCache = new Map()
    }
    this.#sizeCache = new Map()
  }

  /**
   * Tells ScrollableList to refetch a specific row
   * @param row: the row to invalidate
   * @param forCache: 'size' | 'view'   representing which cache to invalidate
   */
  invalidateItem(item: T, forCache: 'size' | 'view') {
    if (forCache === 'view') {
      this.#viewCache.delete(item)
    }
    this.#sizeCache.delete(item)
  }

  invalidateSize() {
    this.#maxWidth = 0
    this.invalidateAllRows('size')
    super.invalidateSize()
  }

  receiveMouse(event: MouseEvent) {
    if (event.name === 'mouse.wheel.up') {
      this.scrollBy(this.#scrollHeight * -1)
    } else if (event.name === 'mouse.wheel.down') {
      this.scrollBy(this.#scrollHeight)
    } else if (isMouseDragging(event) && this.#totalHeight) {
      if (this.#totalHeight <= this.contentSize.height) {
        this.#contentOffset = {row: 0, offset: 0}
        return
      }

      const maxY = this.#totalHeight - this.contentSize.height
      const heightY = Math.round(
        interpolate(
          Math.max(0, Math.min(this.contentSize.height - 1, event.position.y)),
          [0, this.contentSize.height - 1],
          [0, maxY],
        ),
      )
      this.#isAtBottom = heightY === maxY
      const cellWidth = this.contentSize.width
      for (let row = 0, y = 0; row < this.#items.length; row++) {
        const rowHeight = this.sizeForRow(row, cellWidth)?.height
        if (rowHeight === undefined) {
          break
        }

        if (y + rowHeight >= heightY) {
          this.#contentOffset = {row, offset: y - heightY}
          return
        }

        y += rowHeight
      }
    }
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
  scrollBy(offset: number) {
    if (offset === 0) {
      return
    }

    this.invalidateSize()

    const {row, offset: currentOffset} = this.#contentOffset

    let height = this.sizeForRow(row, this.contentSize.width)?.height
    if (height === undefined) {
      this.#contentOffset = {row: 0, offset: 0}
      return
    }

    // prevent scrolling if there is no more content
    if (offset > 0) {
      const doScroll = this.#checkScrollDown(row, currentOffset, height)
      if (!doScroll) {
        this.#isAtBottom = true
        return
      }
    } else if (row === 0 && currentOffset >= 0) {
      // no helper function necessary here - if offset < 0, do not scroll if we are
      // already at the top
      return
    }
    this.#isAtBottom = false

    let nextOffset = currentOffset - offset
    if (nextOffset <= -height) {
      this.#contentOffset = this.#scrollDownToNextRow(row, nextOffset, height)
    } else if (nextOffset > 0) {
      this.#contentOffset = this.#scrollUpToPrevRow(row, nextOffset, height)
    } else {
      this.#contentOffset = {row: row, offset: nextOffset}
    }
  }

  updateItems(items: T[]) {
    this.#items = items
    this.invalidateAllRows('view')
    this.invalidateSize()
  }

  viewForRow(row: number): View | undefined {
    if (row < 0 || row >= this.#items.length) {
      return
    }

    const item = this.#items[row]
    let view = this.#viewCache.get(item)
    if (!view) {
      view = this.#renderItem(item, row)
      if (view) {
        this.#viewCache.set(item, view)
      }
    }

    return view
  }

  sizeForRow(row: number, contentWidth: number, view: View): Size
  sizeForRow(row: number, contentWidth: number): Size | undefined
  sizeForRow(row: number, contentWidth: number, view?: View): Size | undefined {
    const item = this.#items[row]
    if (contentWidth === this.contentSize.width && item) {
      const size = this.#sizeCache.get(item)
      if (size !== undefined) {
        return size
      }
    }

    view = view ?? this.viewForRow(row)
    if (view === undefined) {
      return undefined
    }

    const size = view.naturalSize(new Size(contentWidth, 0))
    if (contentWidth === this.contentSize.width && item) {
      this.#sizeCache.set(item, size)
    }

    return size
  }

  get contentSize(): Size {
    return super.contentSize.shrink(this.#showScrollbars ? 1 : 0, 0)
  }

  lastOffset(): ContentOffset {
    const cellCount = this.#items.length
    const cellWidth = this.contentSize.width
    let row = cellCount - 1
    let y = 0
    while (y < this.contentSize.height) {
      const height = this.sizeForRow(row, cellWidth)?.height
      if (height === undefined) {
        return {row: 0, offset: 0}
      }

      y += height
      if (y >= this.contentSize.height) {
        break
      }

      row -= 1
    }

    return {row, offset: this.contentSize.height - y}
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return super.render(viewport)
    }

    viewport.registerMouse('mouse.wheel')

    if (
      this.#contentOffset.row >= this.#items.length ||
      (this.#keepAtBottom && this.#isAtBottom)
    ) {
      const offset = this.lastOffset()
      this.#contentOffset = offset
    }

    const cellWidth = this.contentSize.width
    const prevRows = new Set(this.children)
    const visibleRows = new Set<View>()

    let {row, offset: y} = this.#contentOffset
    let heights: [number, number, number] = [0, 0, 0]

    if (this.#showScrollbars) {
      for (let i = 0; i < row; i++) {
        heights[0] += this.sizeForRow(i, cellWidth)?.height ?? 0
      }
      heights[1] = heights[0]
    }

    while (y < viewport.contentSize.height) {
      const view = this.viewForRow(row)
      if (!view) {
        break
      }

      const height = this.sizeForRow(row, cellWidth, view)?.height

      if (y === this.#contentOffset.offset && y + height <= 0) {
        y = this.#contentOffset.offset = 0
      }

      row += 1
      heights[1] += height

      if (view.parent !== this) {
        this.add(view)
      }

      visibleRows.add(view)

      if (
        y < viewport.visibleRect.maxY() &&
        y + height >= viewport.visibleRect.minY()
      ) {
        const rect = new Rect(new Point(0, y), new Size(cellWidth, height))
        viewport.clipped(rect, inside => {
          view.render(inside)
        })
      }

      y += height
      if (y >= viewport.contentSize.height) {
        break
      }
    }

    for (const prevRow of prevRows) {
      if (!visibleRows.has(prevRow)) {
        this.removeChild(prevRow)
      }
    }

    if (this.#showScrollbars) {
      viewport.registerMouse(
        'mouse.button.left',
        new Rect(
          new Point(cellWidth, 0),
          new Size(1, viewport.contentSize.height),
        ),
      )

      heights[2] = heights[1]
      for (let i = row; i < this.#items.length; i++) {
        const rowHeight = this.sizeForRow(i, cellWidth)?.height
        if (rowHeight === undefined) {
          break
        }
        heights[2] += rowHeight
      }
      this.#totalHeight = heights[2]

      for (let y = 0; y < viewport.contentSize.height; y++) {
        const h = interpolate(
          y,
          [0, viewport.contentSize.height - 1],
          [0, heights[2]],
        )
        const inRange = ~~h >= heights[0] && ~~h <= heights[1] + 1
        viewport.write(
          inRange ? '█' : ' ',
          new Point(cellWidth, y),
          new Style(
            inRange
              ? {
                  foreground: this.theme.highlightColor,
                  background: this.theme.highlightColor,
                }
              : {
                  foreground: this.theme.darkenColor,
                  background: this.theme.darkenColor,
                },
          ),
        )
      }
    }
  }

  /**
   * Returns 'true' if the scroll should be allowed, returns 'false' if there
   * is no more content to be shown (do not scroll down)
   */
  #checkScrollDown(row: number, currentOffset: number, height: number) {
    // add heights of visible cells – if we run out of cells before
    // y > this.contentSize, exit. Otherwise, scroll.
    let y = currentOffset
    let nextRow = row
    let nextHeight: number | undefined = height
    while (nextHeight !== undefined) {
      y += nextHeight
      if (y > this.contentSize.height) {
        return true
      }
      nextHeight = this.sizeForRow(++nextRow, this.contentSize.width)?.height
      if (nextHeight === undefined) {
        return false
      }
    }
  }

  #scrollDownToNextRow(row: number, nextOffset: number, height: number) {
    let nextRow = row
    while (nextOffset <= -height) {
      const nextHeight = this.sizeForRow(
        nextRow + 1,
        this.contentSize.width,
      )?.height
      if (nextHeight === undefined) {
        nextOffset = -height
        break
      }
      nextOffset += height
      height = nextHeight
      nextRow += 1
    }

    return {row: nextRow, offset: nextOffset}
  }

  #scrollUpToPrevRow(row: number, nextOffset: number, height: number) {
    let nextRow = row
    while (nextOffset > 0) {
      const nextHeight = this.sizeForRow(
        nextRow - 1,
        this.contentSize.width,
      )?.height
      if (nextHeight === undefined) {
        nextOffset = 0
        break
      }
      height = nextHeight
      nextOffset -= height
      nextRow -= 1
    }

    return {row: nextRow, offset: nextOffset}
  }
}
