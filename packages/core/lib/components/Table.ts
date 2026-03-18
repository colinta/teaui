import * as unicode from '@teaui/term'

import type {Viewport} from '../Viewport.js'
import {type Props as ViewProps, View} from '../View.js'
import {Container} from '../Container.js'
import {Style} from '../Style.js'
import {Rect, Point, Size} from '../geometry.js'
import {
  type MouseEvent,
  type KeyEvent,
  isMouseClicked,
} from '../events/index.js'
import {System} from '../System.js'

export interface Column<TData> {
  key: string
  title: string
  width?: number | 'auto'
  align?: 'left' | 'center' | 'right'
}

type SortDirection = 'asc' | 'desc'

interface Props<TData> extends ViewProps {
  data: TData[]
  columns: Column<TData>[]
  format: (key: string, row: TData) => string
  selectedIndex?: number
  onSelect?: (row: TData, index: number) => void
  onSort?: (key: string, direction: SortDirection) => void
  sortKey?: string
  sortDirection?: SortDirection
}

/**
 * A data table with sortable headers, selectable/scrollable rows, and column layout.
 *
 * ```
 *  Name         │ Age │ Email              │ Status
 * ─────────────────────────────────────────────────
 *  Alice        │  30 │ alice@example.com  │ Active
 * ▶Bob          │  25 │ bob@example.com    │ Pending ◀
 *  Charlie      │  35 │ charlie@ex.com     │ Active
 * ```
 */
export class Table<TData> extends Container {
  #data: TData[] = []
  #columns: Column<TData>[] = []
  #format: Props<TData>['format'] = () => ''
  #selectedIndex: number = 0
  #onSelect: Props<TData>['onSelect']
  #onSort: Props<TData>['onSort']
  #sortKey?: string
  #sortDirection: SortDirection = 'asc'

  // scroll state
  #scrollOffset = 0
  #bodyHeight = 0

  constructor(props: Props<TData>) {
    super(props)
    this.#update(props)
  }

  update(props: Props<TData>) {
    this.#update(props)
    super.update(props)
  }

  #update({
    data,
    columns,
    format,
    selectedIndex,
    onSelect,
    onSort,
    sortKey,
    sortDirection,
  }: Props<TData>) {
    this.#data = data ?? []
    this.#columns = columns ?? []
    this.#format = format ?? (() => '')
    if (selectedIndex !== undefined) {
      this.#selectedIndex = selectedIndex
    }
    this.#onSelect = onSelect
    this.#onSort = onSort
    this.#sortKey = sortKey
    this.#sortDirection = sortDirection ?? 'asc'
  }

  get selectedIndex() {
    return this.#selectedIndex
  }

  set selectedIndex(value: number) {
    this.#selectedIndex = Math.max(0, Math.min(this.#data.length - 1, value))
    this.#ensureSelectedVisible()
    this.invalidateRender()
  }

  naturalSize(available: Size): Size {
    return available
  }

  receiveKey(event: KeyEvent) {
    switch (event.name) {
      case 'up':
        this.selectedIndex = this.#selectedIndex - 1
        break
      case 'down':
        this.selectedIndex = this.#selectedIndex + 1
        break
      case 'home':
        this.selectedIndex = 0
        break
      case 'end':
        this.selectedIndex = this.#data.length - 1
        break
      case 'return':
        if (this.#data.length > 0 && this.#onSelect) {
          this.#onSelect(this.#data[this.#selectedIndex], this.#selectedIndex)
        }
        break
    }
  }

  receiveMouse(event: MouseEvent, system: System) {
    super.receiveMouse(event, system)

    if (event.name === 'mouse.wheel.up') {
      this.#scrollOffset = Math.max(0, this.#scrollOffset - 1)
      this.invalidateRender()
    } else if (event.name === 'mouse.wheel.down') {
      const maxScroll = Math.max(0, this.#data.length - this.#bodyHeight)
      this.#scrollOffset = Math.min(maxScroll, this.#scrollOffset + 1)
      this.invalidateRender()
    } else if (isMouseClicked(event)) {
      const y = event.position.y
      // header row = 0, separator = 1, data rows start at 2
      if (y === 0) {
        this.#handleHeaderClick(event.position.x)
      } else if (y >= 2) {
        const rowIndex = this.#scrollOffset + (y - 2)
        if (rowIndex < this.#data.length) {
          this.selectedIndex = rowIndex
          this.#onSelect?.(this.#data[rowIndex], rowIndex)
        }
      }
    }
  }

  #handleHeaderClick(x: number) {
    const INDENT = 1
    const widths = this.#calculateColumnWidths(this.contentSize.width - INDENT)
    let currentX = INDENT
    for (let i = 0; i < this.#columns.length; i++) {
      const colWidth = widths[i]
      // account for separator (3 chars: ' │ ')
      const nextX = currentX + colWidth + (i < this.#columns.length - 1 ? 3 : 0)
      if (x >= currentX && x < nextX) {
        const col = this.#columns[i]
        if (this.#onSort) {
          const direction: SortDirection =
            this.#sortKey === col.key && this.#sortDirection === 'asc'
              ? 'desc'
              : 'asc'
          this.#onSort(col.key, direction)
        }
        return
      }
      currentX = nextX
    }
  }

  #calculateColumnWidths(totalWidth: number): number[] {
    const cols = this.#columns
    const separatorWidth = (cols.length - 1) * 3 // ' │ ' between columns
    const available = totalWidth - separatorWidth

    let fixedTotal = 0
    let autoCount = 0

    for (const col of cols) {
      if (typeof col.width === 'number') {
        fixedTotal += col.width
      } else {
        autoCount += 1
      }
    }

    const autoWidth =
      autoCount > 0 ? Math.floor((available - fixedTotal) / autoCount) : 0

    return cols.map(col => {
      if (typeof col.width === 'number') {
        return col.width
      }
      return Math.max(autoWidth, col.title.length)
    })
  }

  #ensureSelectedVisible() {
    if (this.#bodyHeight <= 0) {
      return
    }

    const halfHeight = Math.floor(this.#bodyHeight / 2)

    if (this.#selectedIndex < this.#scrollOffset) {
      this.#scrollOffset = this.#selectedIndex
    } else if (this.#selectedIndex >= this.#scrollOffset + this.#bodyHeight) {
      this.#scrollOffset = this.#selectedIndex - this.#bodyHeight + 1
    } else if (
      this.#selectedIndex >= halfHeight &&
      this.#selectedIndex < this.#data.length - halfHeight
    ) {
      // "moving window" for middle rows: selected stays at the center
      this.#scrollOffset = this.#selectedIndex - halfHeight
    } else if (this.#selectedIndex >= this.#data.length - halfHeight) {
      // "bottom zone": pin scroll so last rows are visible, selected moves down
      this.#scrollOffset = Math.max(0, this.#data.length - this.#bodyHeight)
    }

    const maxScroll = Math.max(0, this.#data.length - this.#bodyHeight)
    this.#scrollOffset = Math.max(0, Math.min(maxScroll, this.#scrollOffset))
  }

  #alignText(
    text: string,
    width: number,
    align: Column<TData>['align'],
  ): string {
    const textWidth = unicode.lineWidth(text)
    if (textWidth >= width) {
      // truncate
      let w = 0
      let result = ''
      for (const char of unicode.printableChars(text)) {
        const cw = unicode.charWidth(char)
        if (cw === 0) {
          result += char
          continue
        }
        if (w + cw > width - 1) {
          result += '…'
          break
        }
        result += char
        w += cw
      }
      return result
    }

    const pad = width - textWidth
    switch (align) {
      case 'right':
        return ' '.repeat(pad) + text
      case 'center': {
        const left = Math.floor(pad / 2)
        const right = pad - left
        return ' '.repeat(left) + text + ' '.repeat(right)
      }
      default:
        return text + ' '.repeat(pad)
    }
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return super.render(viewport)
    }

    viewport.registerFocus()
    viewport.registerMouse(['mouse.button.left', 'mouse.wheel'])

    const width = viewport.contentSize.width
    const height = viewport.contentSize.height
    // Reserve 1 character at the left for the selection marker (▶)
    const INDENT = 1
    const contentWidth = width - INDENT
    const widths = this.#calculateColumnWidths(contentWidth)
    const dimStyle = new Style({dim: true})
    const headerStyle = new Style({dim: true, bold: true})
    const selectedStyle = new Style({
      foreground: this.theme.textColor,
      background: this.theme.highlightColor,
      bold: true,
    })

    // Header row
    let headerX = INDENT
    for (let i = 0; i < this.#columns.length; i++) {
      const col = this.#columns[i]
      const aligned = this.#alignText(col.title, widths[i], col.align ?? 'left')
      viewport.write(aligned, new Point(headerX, 0), headerStyle)

      // Write sort arrow on top, positioned after the title text, clamped to column width
      if (this.#sortKey === col.key) {
        const arrow = this.#sortDirection === 'asc' ? '▲' : '▼'
        const titleWidth = unicode.lineWidth(col.title)
        // Place arrow 1 space after title, but clamp to last position in column
        const arrowOffset = Math.min(titleWidth + 1, widths[i] - 1)
        viewport.write(arrow, new Point(headerX + arrowOffset, 0), headerStyle)
      }

      headerX += widths[i]
      if (i < this.#columns.length - 1) {
        viewport.write(' │ ', new Point(headerX, 0), dimStyle)
        headerX += 3
      }
    }

    // Separator
    if (height > 1) {
      const sep = '─'.repeat(width)
      viewport.write(sep, new Point(0, 1), dimStyle)
    }

    // Body
    this.#bodyHeight = Math.max(0, height - 2)
    this.#ensureSelectedVisible()

    const rowsAbove = this.#scrollOffset
    const rowsBelow = Math.max(
      0,
      this.#data.length - this.#scrollOffset - this.#bodyHeight,
    )

    for (let i = 0; i < this.#bodyHeight; i++) {
      const rowIndex = this.#scrollOffset + i
      const y = i + 2
      if (rowIndex >= this.#data.length) {
        break
      }

      const isSelected = rowIndex === this.#selectedIndex
      const row = this.#data[rowIndex]
      const rowStyle = isSelected ? selectedStyle : Style.NONE

      // Determine if this row has a scroll indicator overlaid on top
      let scrollIndicator: string | undefined
      if (i === 0 && rowsAbove > 0) {
        const hiddenCount = rowsAbove + 1 // +1 for the row occluded by indicator
        scrollIndicator = ` [ ↑ ${hiddenCount} more rows ] `
      } else if (i === this.#bodyHeight - 1 && rowsBelow > 0) {
        const hiddenCount = rowsBelow + 1 // +1 for the row occluded by indicator
        scrollIndicator = ` [ ↓ ${hiddenCount} more rows ] `
      }

      // Styles for rows occluded by scroll indicators (easily customisable)
      const occludedRowStyle = new Style({dim: true})
      const occludedSepStyle = new Style({dim: true})
      const indicatorStyle = new Style({bold: true, background: '#333333'})

      // Pick effective styles: occluded > selected > normal
      const effectiveRowStyle = scrollIndicator
        ? occludedRowStyle
        : isSelected
          ? selectedStyle
          : Style.NONE
      const effectiveSepStyle = scrollIndicator
        ? occludedSepStyle
        : isSelected
          ? selectedStyle
          : dimStyle

      if (isSelected && !scrollIndicator) {
        viewport.write(' '.repeat(width), new Point(0, y), selectedStyle)
        viewport.write('▶', new Point(0, y), selectedStyle)
      }

      // Render the row cells (dimmed when occluded, highlighted when selected)
      let cellX = INDENT
      for (let j = 0; j < this.#columns.length; j++) {
        const col = this.#columns[j]
        const text = this.#format(col.key, row)
        const aligned = this.#alignText(text, widths[j], col.align ?? 'left')

        viewport.write(aligned, new Point(cellX, y), effectiveRowStyle)

        cellX += widths[j]
        if (j < this.#columns.length - 1) {
          viewport.write(' │ ', new Point(cellX, y), effectiveSepStyle)
          cellX += 3
        }
      }

      // Overlay the scroll indicator label, centered on the row
      if (scrollIndicator) {
        const indicatorWidth = unicode.lineWidth(scrollIndicator)
        const indicatorX = Math.max(0, Math.floor((width - indicatorWidth) / 2))
        viewport.write(
          scrollIndicator,
          new Point(indicatorX, y),
          indicatorStyle,
        )
      }
    }
  }
}
