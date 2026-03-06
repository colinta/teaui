import {Style} from '@teaui/core'
import type {Color} from '@teaui/core'

// xterm-headless color mode constants
const CM_DEFAULT = 0
const CM_PALETTE = 16777216
const CM_RGB = 50331648

/**
 * Interface matching the xterm-headless IBufferCell API.
 * Using an interface allows easy mocking in tests.
 */
export interface XtermCell {
  getChars(): string
  getWidth(): number
  getFgColor(): number
  getBgColor(): number
  getFgColorMode(): number
  getBgColorMode(): number
  isBold(): number
  isDim(): number
  isItalic(): number
  isUnderline(): number
  isInverse(): number
  isBlink(): number
  isInvisible(): number
  isStrikethrough(): number
}

function colorFromXterm(
  colorValue: number,
  colorMode: number,
): Color | undefined {
  switch (colorMode) {
    case CM_DEFAULT:
      return undefined
    case CM_PALETTE:
      return {sgr: colorValue}
    case CM_RGB: {
      const r = (colorValue >> 16) & 0xff
      const g = (colorValue >> 8) & 0xff
      const b = colorValue & 0xff
      return [r, g, b]
    }
    default:
      return undefined
  }
}

/**
 * Convert an xterm-headless buffer cell's attributes to a TeaUI Style.
 */
export function xtermCellToStyle(cell: XtermCell): Style {
  return new Style({
    bold: cell.isBold() !== 0 ? true : undefined,
    dim: cell.isDim() !== 0 ? true : undefined,
    italic: cell.isItalic() !== 0 ? true : undefined,
    underline: cell.isUnderline() !== 0 ? true : undefined,
    inverse: cell.isInverse() !== 0 ? true : undefined,
    blink: cell.isBlink() !== 0 ? true : undefined,
    invisible: cell.isInvisible() !== 0 ? true : undefined,
    strikeout: cell.isStrikethrough() !== 0 ? true : undefined,
    foreground: colorFromXterm(cell.getFgColor(), cell.getFgColorMode()),
    background: colorFromXterm(cell.getBgColor(), cell.getBgColorMode()),
  })
}

/**
 * Compute a cache key for an xterm cell's style attributes.
 * Encodes all 10 style properties into a single number/string for Map lookup.
 *
 * Layout (bit-packed for common cases):
 *   bits 0-7:  attribute flags (bold, dim, italic, underline, inverse, blink, invisible, strikethrough)
 *   bits 8-9:  fg color mode (0=default, 1=palette, 2=RGB)
 *   bits 10-11: bg color mode (0=default, 1=palette, 2=RGB)
 *
 * For default colors (most cells), the key is just the 8-bit attribute flags — a small integer.
 * For palette/RGB colors, we append the color values to make a unique string key.
 */
function cellStyleKey(cell: XtermCell): number | string {
  const attrs =
    (cell.isBold() !== 0 ? 1 : 0) |
    (cell.isDim() !== 0 ? 2 : 0) |
    (cell.isItalic() !== 0 ? 4 : 0) |
    (cell.isUnderline() !== 0 ? 8 : 0) |
    (cell.isInverse() !== 0 ? 16 : 0) |
    (cell.isBlink() !== 0 ? 32 : 0) |
    (cell.isInvisible() !== 0 ? 64 : 0) |
    (cell.isStrikethrough() !== 0 ? 128 : 0)

  const fgMode = cell.getFgColorMode()
  const bgMode = cell.getBgColorMode()

  // Fast path: default colors, no attributes — Style.NONE
  // Fast path: default colors with attributes — small integer key
  if (fgMode === CM_DEFAULT && bgMode === CM_DEFAULT) {
    return attrs
  }

  // Slower path: include color values in key
  return `${attrs}:${fgMode}:${cell.getFgColor()}:${bgMode}:${cell.getBgColor()}`
}

/**
 * Style cache that avoids creating new Style objects for repeated cell styles.
 * Most terminal content uses very few distinct styles (typically 1-10), so this
 * eliminates thousands of Style allocations per frame.
 *
 * Call `clear()` periodically (e.g. on resize) to prevent unbounded growth,
 * though in practice the cache stays very small.
 */
export class StyleCache {
  #cache = new Map<number | string, Style>()

  constructor() {
    // Pre-populate with Style.NONE for the default (no attributes, no colors) case
    this.#cache.set(0, Style.NONE)
  }

  /**
   * Get or create a Style for the given xterm cell.
   * Returns the same Style instance for cells with identical styling.
   */
  styleForCell(cell: XtermCell): Style {
    const key = cellStyleKey(cell)
    let style = this.#cache.get(key)
    if (style !== undefined) {
      return style
    }
    style = xtermCellToStyle(cell)
    this.#cache.set(key, style)
    return style
  }

  /** Number of cached styles (for testing/debugging). */
  get size(): number {
    return this.#cache.size
  }

  /** Clear the cache. */
  clear() {
    this.#cache.clear()
    this.#cache.set(0, Style.NONE)
  }
}
