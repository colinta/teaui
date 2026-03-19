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
  /**
   * Whether clicking this column header sorts the table. Default: false.
   */
  sortable?: boolean
}

export type SortDirection = 'asc' | 'desc'

interface Props<TData> extends ViewProps {
  data: TData[]
  columns: Column<TData>[]
  format: (key: string, row: TData) => string
  selectedIndex?: number
  /**
   * Fired when the user presses Enter on a row, or clicks a data row.
   */
  onSelect?: (row: TData, index: number) => void
  /**
   * Notification fired after the sort changes (header click on a sortable column).
   * The Table manages sort state internally — this is for external sync.
   */
  onSort?: (key: string, direction: SortDirection) => void
  /**
   * Initial sort column key. Must match a column with `sortable: true`.
   */
  sortKey?: string
  /**
   * Initial sort direction. Default: 'asc'.
   */
  sortDirection?: SortDirection
  /**
   * Show a row number column (right-aligned, header '#'). Default: false.
   */
  showRowNumbers?: boolean
  /**
   * Enable multi-selection (space bar or click to toggle). Default: false.
   */
  isSelectable?: boolean
  /**
   * Show a checkbox column ([ ]/[⨉]) for multi-selection. Implies isSelectable. Default: false.
   */
  showSelected?: boolean
  /**
   * Notification fired when the set of selected items changes.
   */
  onSelectionChange?: (selectedItems: Set<TData>) => void
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
  #sourceData: TData[] = []
  #data: TData[] = []
  #columns: Column<TData>[] = []
  #format: Props<TData>['format'] = () => ''
  #selectedIndex: number = 0
  #onSelect: Props<TData>['onSelect']
  #onSort: Props<TData>['onSort']
  #sortKey?: string
  #sortDirection: SortDirection = 'asc'
  #showRowNumbers: boolean = false
  #isSelectable: boolean = false
  #showSelected: boolean = false
  #onSelectionChange: Props<TData>['onSelectionChange']
  #selectedItems: Set<TData> = new Set()

  // scroll state
  #scrollOffset = 0
  #bodyHeight = 0
  #selectionDirty = true

  constructor(props: Props<TData>) {
    super(props)
    this.#update(props)
  }

  update(props: Partial<Props<TData>>) {
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
    showRowNumbers,
    isSelectable,
    showSelected,
    onSelectionChange,
  }: Partial<Props<TData>>) {
    if (showRowNumbers !== undefined) {
      this.#showRowNumbers = showRowNumbers
    }
    if (isSelectable !== undefined) {
      this.#isSelectable = isSelectable
    }
    if (showSelected !== undefined) {
      this.#showSelected = showSelected
      if (showSelected) {
        this.#isSelectable = true
      }
    }
    if (onSelectionChange !== undefined) {
      this.#onSelectionChange = onSelectionChange
    }
    const dataChanged = data !== undefined && data !== this.#sourceData
    const sortChanged =
      sortKey !== undefined &&
      (sortKey !== this.#sortKey || sortDirection !== this.#sortDirection)

    this.#columns = columns ?? this.#columns
    this.#format = format ?? this.#format
    if (selectedIndex !== undefined) {
      this.#selectedIndex = selectedIndex
      this.#selectionDirty = true
    }
    if (onSelect !== undefined) {
      this.#onSelect = onSelect
    }
    if (onSort !== undefined) {
      this.#onSort = onSort
    }
    if (sortKey !== undefined) {
      this.#sortKey = sortKey
    }
    if (sortDirection !== undefined) {
      this.#sortDirection = sortDirection
    }

    if (data !== undefined) {
      this.#sourceData = data
    }

    if (dataChanged || sortChanged) {
      this.#sortData()
    }
  }

  #sortData() {
    if (!this.#sortKey) {
      this.#data = [...this.#sourceData]
      if (this.#sortDirection === 'desc') {
        this.#data.reverse()
      }
      return
    }

    const key = this.#sortKey
    const dir = this.#sortDirection
    this.#data = [...this.#sourceData].sort((a, b) => {
      const aVal = this.#format(key, a)
      const bVal = this.#format(key, b)
      const cmp = aVal.localeCompare(bVal, undefined, {numeric: true})
      return dir === 'asc' ? cmp : -cmp
    })
  }

  get selectedIndex() {
    return this.#selectedIndex
  }

  set selectedIndex(value: number) {
    this.#selectedIndex = Math.max(0, Math.min(this.#data.length - 1, value))
    this.#selectionDirty = true
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
      case 'pageup':
        this.selectedIndex =
          this.#selectedIndex - Math.max(1, this.#bodyHeight - 2)
        break
      case 'pagedown':
        this.selectedIndex =
          this.#selectedIndex + Math.max(1, this.#bodyHeight - 2)
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
      case 'space':
        this.#toggleSelection(this.#selectedIndex)
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
          if (this.#isSelectable) {
            this.#toggleSelection(rowIndex)
          } else {
            this.#onSelect?.(this.#data[rowIndex], rowIndex)
          }
        }
      }
    }
  }

  #handleHeaderClick(x: number) {
    const INDENT = 1
    const checkboxWidth = this.#checkboxWidth()
    const rowNumWidth = this.#rowNumberWidth()

    // Click on checkbox column header → toggle all
    if (this.#showSelected && x >= INDENT && x < INDENT + checkboxWidth) {
      if (this.#selectedItems.size === this.#data.length) {
        this.#selectedItems.clear()
      } else {
        for (const item of this.#data) {
          this.#selectedItems.add(item)
        }
      }
      this.invalidateRender()
      this.#onSelectionChange?.(new Set(this.#selectedItems))
      return
    }

    // Click on row number column → sort by original array order
    if (
      this.#showRowNumbers &&
      x >= INDENT + checkboxWidth &&
      x < INDENT + checkboxWidth + rowNumWidth
    ) {
      const direction: SortDirection =
        !this.#sortKey && this.#sortDirection === 'asc' ? 'desc' : 'asc'
      this.#sortKey = undefined
      this.#sortDirection = direction
      this.#sortData()
      this.invalidateRender()
      this.#onSort?.('#', direction)
      return
    }

    const widths = this.#calculateColumnWidths(
      this.contentSize.width - INDENT - checkboxWidth - rowNumWidth,
    )
    let currentX = INDENT + checkboxWidth + rowNumWidth
    for (let i = 0; i < this.#columns.length; i++) {
      const colWidth = widths[i]
      // account for separator (3 chars: ' │ ')
      const nextX = currentX + colWidth + (i < this.#columns.length - 1 ? 3 : 0)
      if (x >= currentX && x < nextX) {
        const col = this.#columns[i]
        if (!col.sortable) {
          return
        }

        const direction: SortDirection =
          this.#sortKey === col.key && this.#sortDirection === 'asc'
            ? 'desc'
            : 'asc'
        this.#sortKey = col.key
        this.#sortDirection = direction
        this.#sortData()
        this.invalidateRender()
        this.#onSort?.(col.key, direction)
        return
      }
      currentX = nextX
    }
  }

  #toggleSelection(rowIndex: number) {
    if (!this.#isSelectable || rowIndex < 0 || rowIndex >= this.#data.length) {
      return
    }

    const item = this.#data[rowIndex]
    if (this.#selectedItems.has(item)) {
      this.#selectedItems.delete(item)
    } else {
      this.#selectedItems.add(item)
    }
    this.invalidateRender()
    this.#onSelectionChange?.(new Set(this.#selectedItems))
  }

  /** Width of the checkbox column (including trailing separator). */
  #checkboxWidth(): number {
    if (!this.#showSelected) {
      return 0
    }
    return 3 + 3 // '[⨉]' (3) + ' │ ' (3)
  }

  /** Width of the row number column (including trailing separator space). */
  #rowNumberWidth(): number {
    if (!this.#showRowNumbers) {
      return 0
    }
    // Width of the largest row number, minimum width of '#' header
    const digitWidth = Math.max(1, String(this.#data.length).length)
    return digitWidth + 3 // digits + ' │ '
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

    // Ensure the selected row doesn't land on an indicator row.
    // Top indicator occupies position 0 when scrollOffset > 0.
    // Bottom indicator occupies the last position when there are rows below.
    if (this.#data.length > this.#bodyHeight) {
      const rowsAbove = this.#scrollOffset
      const rowsBelow =
        this.#data.length - this.#scrollOffset - this.#bodyHeight

      if (rowsAbove > 0 && this.#selectedIndex === this.#scrollOffset) {
        // Selected would be on the top indicator row — scroll up to make room
        this.#scrollOffset = Math.max(0, this.#selectedIndex - 1)
      }

      if (
        rowsBelow > 0 &&
        this.#selectedIndex === this.#scrollOffset + this.#bodyHeight - 1
      ) {
        // Selected would be on the bottom indicator row — scroll down to make room
        this.#scrollOffset = Math.min(
          maxScroll,
          this.#selectedIndex - this.#bodyHeight + 2,
        )
      }
    }
  }

  #alignText(
    text: string,
    width: number,
    align: Column<TData>['align'],
  ): string {
    const textWidth = unicode.lineWidth(text)
    if (textWidth > width) {
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
    const checkboxWidth = this.#checkboxWidth()
    const rowNumWidth = this.#rowNumberWidth()
    const contentWidth = width - INDENT - checkboxWidth - rowNumWidth
    const widths = this.#calculateColumnWidths(contentWidth)
    const dimStyle = new Style({dim: true})
    const headerStyle = new Style({dim: true, bold: true})
    // Cursor row (not checked)
    const cursorStyle = new Style({
      foreground: this.theme.textColor,
      background: this.theme.highlightColor,
      bold: true,
    })
    // Checked rows: light magenta background
    const checkedRowStyle = new Style({
      background: '#3a2040',
    })
    // Cursor + checked: slightly brighter magenta
    const cursorCheckedStyle = new Style({
      foreground: this.theme.textColor,
      background: '#4d2a55',
      bold: true,
    })

    // Header row
    let headerX = INDENT

    // Checkbox column header
    if (this.#showSelected) {
      viewport.write('[ ]', new Point(headerX, 0), headerStyle)
      headerX += 3
      viewport.write(' │ ', new Point(headerX, 0), dimStyle)
      headerX += 3
    }

    // Row number column header
    if (this.#showRowNumbers) {
      const numColWidth = rowNumWidth - 3 // subtract separator
      const aligned = this.#alignText('#', numColWidth, 'right')
      viewport.write(aligned, new Point(headerX, 0), headerStyle)

      // Show sort arrow when sorting by original order (sortKey is undefined)
      if (!this.#sortKey) {
        const arrow = this.#sortDirection === 'asc' ? '▲' : '▼'
        viewport.write(arrow, new Point(headerX, 0), headerStyle)
      }

      headerX += numColWidth
      viewport.write(' │ ', new Point(headerX, 0), dimStyle)
      headerX += 3
    }

    for (let i = 0; i < this.#columns.length; i++) {
      const col = this.#columns[i]
      const aligned = this.#alignText(col.title, widths[i], col.align ?? 'left')
      viewport.write(aligned, new Point(headerX, 0), headerStyle)

      // Write sort arrow on top, positioned after the title text, clamped to column width
      if (this.#sortKey === col.key) {
        const arrow = this.#sortDirection === 'asc' ? '▲' : '▼'
        const titleWidth = unicode.lineWidth(col.title)
        const align = col.align ?? 'left'
        const titleStart =
          align === 'right'
            ? widths[i] - titleWidth
            : align === 'center'
              ? Math.floor((widths[i] - titleWidth) / 2)
              : 0
        const arrowOffset = Math.min(titleStart + titleWidth + 1, widths[i] - 1)
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
    if (this.#selectionDirty) {
      this.#selectionDirty = false
      this.#ensureSelectedVisible()
    }

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
      const isChecked = this.#selectedItems.has(row)

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

      // Pick effective styles: occluded > cursor+checked > cursor > checked > normal
      const rowHighlight =
        isSelected && isChecked
          ? cursorCheckedStyle
          : isSelected
            ? cursorStyle
            : isChecked
              ? checkedRowStyle
              : Style.NONE
      const sepHighlight =
        isSelected && isChecked
          ? cursorCheckedStyle
          : isSelected
            ? cursorStyle
            : isChecked
              ? checkedRowStyle
              : dimStyle
      const effectiveRowStyle = scrollIndicator
        ? occludedRowStyle
        : rowHighlight
      const effectiveSepStyle = scrollIndicator
        ? occludedSepStyle
        : sepHighlight

      if (!scrollIndicator && (isSelected || isChecked)) {
        viewport.write(' '.repeat(width), new Point(0, y), rowHighlight)
      }
      if (isSelected && !scrollIndicator) {
        viewport.write(
          '▶',
          new Point(0, y),
          isChecked ? cursorCheckedStyle : cursorStyle,
        )
      }

      // Render the row cells (dimmed when occluded, highlighted when selected)
      let cellX = INDENT

      // Checkbox column
      if (this.#showSelected) {
        const checkText = isChecked ? '[⨉]' : '[ ]'
        viewport.write(checkText, new Point(cellX, y), effectiveRowStyle)
        cellX += 3
        viewport.write(' │ ', new Point(cellX, y), effectiveSepStyle)
        cellX += 3
      }

      // Row number column
      if (this.#showRowNumbers) {
        const numColWidth = rowNumWidth - 3 // subtract separator
        const numText = String(rowIndex + 1)
        const aligned = this.#alignText(numText, numColWidth, 'right')
        viewport.write(aligned, new Point(cellX, y), effectiveRowStyle)
        cellX += numColWidth
        viewport.write(' │ ', new Point(cellX, y), effectiveSepStyle)
        cellX += 3
      }

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
