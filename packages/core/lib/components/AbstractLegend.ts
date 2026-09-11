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

export interface Props extends ViewProps {}

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
   * Lay out items into rows. Each row contains indices into the computed items
   * array.
   */
  #layout(computed: ComputedItem[], availableWidth: number): number[][] {
    const rows: number[][] = []
    let currentRow: number[] = []
    let currentWidth = 0

    for (let i = 0; i < computed.length; i++) {
      const item = computed[i]
      const neededWidth =
        currentRow.length === 0
          ? item.totalWidth
          : ITEM_SPACING + item.totalWidth

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

    return rows
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

    const rows = this.#layout(computed, available.width)
    const width = Math.max(
      ...rows.map(row =>
        row.reduce(
          (total, itemIdx, index) =>
            total +
            (index > 0 ? ITEM_SPACING : 0) +
            computed[itemIdx].totalWidth,
          0,
        ),
      ),
    )
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

    const rows = this.#layout(computed, viewport.contentSize.width)

    const keyStyle = new Style({
      foreground: this.purpose.accentTextColor,
      bold: true,
    })
    const labelStyle = new Style({
      foreground: this.purpose.mutedTextColor,
    })
    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      if (rowIdx >= viewport.contentSize.height) break

      const row = rows[rowIdx]
      let x = 0

      for (let colIdx = 0; colIdx < row.length; colIdx++) {
        const itemIdx = row[colIdx]
        const item = computed[itemIdx]

        if (colIdx > 0) {
          x += ITEM_SPACING
        }

        viewport.write(item.keyText, new Point(x, rowIdx), keyStyle)
        x += item.keyWidth

        // Space between key and label
        x += 1

        // Write label
        viewport.write(item.label, new Point(x, rowIdx), labelStyle)

        x += item.labelWidth
      }
    }
  }
}

const ITEM_SPACING = 3
const KEY_SEPARATOR = '/'
const MODIFIER_SIGILS = {
  ctrl: '⌃',
  alt: '⌥',
  gui: '⌘',
  shift: '⇧',
}
