import * as unicode from '@teaui/term'

import type {Viewport} from '../Viewport.js'
import type {Props as ViewProps} from '../View.js'
import {View} from '../View.js'
import {Point, Size} from '../geometry.js'
import {Style} from '../Style.js'
import {mapKey} from '../events/key.js'

export interface LegendItem {
  key: string | string[]
  label: string
}

export interface Props extends ViewProps {
  separator?: string
}

function formatKey(key: string): string {
  // Handle 'C-a', 'A-S-x' style modifier prefixes
  const modRe = /^([CAGS]-)+/
  const modMatch = key.match(modRe)
  if (modMatch) {
    const modStr = modMatch[0]
    const base = key.slice(modStr.length)
    let sigils = ''
    if (modStr.includes('C-')) sigils += MODIFIER_SIGILS.ctrl
    if (modStr.includes('A-')) sigils += MODIFIER_SIGILS.alt
    if (modStr.includes('G-')) sigils += MODIFIER_SIGILS.gui
    if (modStr.includes('S-')) sigils += MODIFIER_SIGILS.shift
    return sigils + mapKey(base)
  }

  return mapKey(key)
}

function formatKeys(key: string | string[]): string {
  if (Array.isArray(key)) {
    return key.map(formatKey).join(KEY_SEPARATOR)
  }

  return formatKey(key)
}

export interface ComputedItem {
  keyText: string
  keyWidth: number
  label: string
  labelWidth: number
  totalWidth: number // keyWidth + 1 (space) + labelWidth
}

export abstract class AbstractLegend extends View {
  #separator: string = '  '

  constructor(props: Props) {
    super(props)
    this.#update(props)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({separator}: Props) {
    this.#separator = separator ?? '  '
  }

  computeItems(items: LegendItem[]): ComputedItem[] {
    return items.map(item => {
      const keyText = formatKeys(item.key)
      const keyWidth = unicode.lineWidth(keyText)
      const labelWidth = unicode.lineWidth(item.label)
      return {
        keyText,
        keyWidth,
        label: item.label,
        labelWidth,
        totalWidth: keyWidth + 1 + labelWidth, // key + space + label
      }
    })
  }

  /**
   * Lay out items into rows. Returns an array of rows, each row being
   * an array of indices into the computed items array, plus per-row column
   * widths for alignment.
   */
  #layout(
    computed: ComputedItem[],
    availableWidth: number,
  ): {rows: number[][]; maxKeyWidth: number; maxLabelWidth: number} {
    if (computed.length === 0) {
      return {rows: [], maxKeyWidth: 0, maxLabelWidth: 0}
    }

    const sepWidth = unicode.lineWidth(this.#separator)

    // Try to fit as many items per row as possible
    const rows: number[][] = []
    let currentRow: number[] = []
    let currentWidth = 0

    for (let i = 0; i < computed.length; i++) {
      const item = computed[i]
      const neededWidth =
        currentRow.length === 0 ? item.totalWidth : sepWidth + item.totalWidth

      if (
        currentRow.length > 0 &&
        currentWidth + neededWidth > availableWidth
      ) {
        rows.push(currentRow)
        currentRow = [i]
        currentWidth = item.totalWidth
      } else {
        currentRow.push(i)
        currentWidth += neededWidth
      }
    }
    if (currentRow.length > 0) {
      rows.push(currentRow)
    }

    // If only one row, no column alignment needed
    if (rows.length <= 1) {
      const maxKeyWidth = Math.max(...computed.map(c => c.keyWidth))
      const maxLabelWidth = Math.max(...computed.map(c => c.labelWidth))
      return {rows, maxKeyWidth, maxLabelWidth}
    }

    // Calculate max key and label widths per column
    let maxKeyWidth = 0
    let maxLabelWidth = 0
    for (const row of rows) {
      for (const idx of row) {
        maxKeyWidth = Math.max(maxKeyWidth, computed[idx].keyWidth)
        maxLabelWidth = Math.max(maxLabelWidth, computed[idx].labelWidth)
      }
    }

    return {rows, maxKeyWidth, maxLabelWidth}
  }

  /**
   * called during render and naturalSize - subclasses cache the result.
   */
  abstract collectItems(): ComputedItem[]

  naturalSize(available: Size): Size {
    const computed = this.collectItems()
    if (computed.length === 0) {
      return Size.zero
    }

    const sepWidth = unicode.lineWidth(this.#separator)
    const {rows, maxKeyWidth, maxLabelWidth} = this.#layout(
      computed,
      available.width,
    )

    if (rows.length <= 1) {
      // Single row: tight width
      let width = 0
      for (let i = 0; i < computed.length; i++) {
        if (i > 0) width += sepWidth
        width += computed[i].totalWidth
      }
      return new Size(Math.min(width, available.width), 1)
    }

    // Multi-row: use column-aligned width
    const colWidth = maxKeyWidth + 1 + maxLabelWidth
    const numCols = Math.max(...rows.map(r => r.length))
    const width = numCols * colWidth + (numCols - 1) * sepWidth
    return new Size(Math.min(width, available.width), rows.length)
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return
    }

    const computed = this.collectItems()
    if (computed.length === 0) {
      return
    }

    const {rows, maxKeyWidth, maxLabelWidth} = this.#layout(
      computed,
      viewport.contentSize.width,
    )

    const keyStyle = new Style({
      foreground: this.theme.contrastTextColor,
      bold: true,
    })
    const labelStyle = new Style({
      foreground: this.theme.dimTextColor,
    })
    const sepStyle = new Style({
      foreground: this.theme.dimTextColor,
    })

    const sepWidth = unicode.lineWidth(this.#separator)
    const multiRow = rows.length > 1
    const colWidth = multiRow ? maxKeyWidth + 1 + maxLabelWidth : 0

    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      if (rowIdx >= viewport.contentSize.height) break

      const row = rows[rowIdx]
      let x = 0

      for (let colIdx = 0; colIdx < row.length; colIdx++) {
        const itemIdx = row[colIdx]
        const item = computed[itemIdx]

        if (colIdx > 0) {
          viewport.write(this.#separator, new Point(x, rowIdx), sepStyle)
          x += sepWidth
        }

        // Write key (right-aligned within maxKeyWidth for multi-row)
        if (multiRow) {
          const pad = maxKeyWidth - item.keyWidth
          viewport.write(item.keyText, new Point(x + pad, rowIdx), keyStyle)
          x += maxKeyWidth
        } else {
          viewport.write(item.keyText, new Point(x, rowIdx), keyStyle)
          x += item.keyWidth
        }

        // Space between key and label
        x += 1

        // Write label
        viewport.write(item.label, new Point(x, rowIdx), labelStyle)

        if (multiRow) {
          x += maxLabelWidth
        } else {
          x += item.labelWidth
        }
      }
    }
  }
}

const KEY_SEPARATOR = '/'
const MODIFIER_SIGILS = {
  ctrl: '⌃',
  alt: '⌥',
  gui: '⌘',
  shift: '⇧',
}
