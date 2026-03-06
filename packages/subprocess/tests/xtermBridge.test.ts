import {describe, it, expect} from 'vitest'
import {Style} from '@teaui/core'
import {xtermCellToStyle, StyleCache} from '../lib/xtermBridge.js'
import type {XtermCell} from '../lib/xtermBridge.js'

// Color mode constants matching xterm-headless internal values
const CM_DEFAULT = 0
const CM_PALETTE = 16777216
const CM_RGB = 50331648

function mockCell(overrides: Partial<XtermCell> = {}): XtermCell {
  return {
    getChars: () => 'A',
    getWidth: () => 1,
    getFgColor: () => 0,
    getBgColor: () => 0,
    getFgColorMode: () => CM_DEFAULT,
    getBgColorMode: () => CM_DEFAULT,
    isBold: () => 0,
    isDim: () => 0,
    isItalic: () => 0,
    isUnderline: () => 0,
    isInverse: () => 0,
    isBlink: () => 0,
    isInvisible: () => 0,
    isStrikethrough: () => 0,
    ...overrides,
  }
}

describe('xtermCellToStyle', () => {
  describe('default/empty cell', () => {
    it('returns style with no attributes set', () => {
      const style = xtermCellToStyle(mockCell())
      expect(style.bold).toBeUndefined()
      expect(style.dim).toBeUndefined()
      expect(style.italic).toBeUndefined()
      expect(style.underline).toBeUndefined()
      expect(style.inverse).toBeUndefined()
      expect(style.foreground).toBeUndefined()
      expect(style.background).toBeUndefined()
    })
  })

  describe('text attributes', () => {
    it('bold', () => {
      const style = xtermCellToStyle(mockCell({isBold: () => 1}))
      expect(style.bold).toBe(true)
    })

    it('dim', () => {
      const style = xtermCellToStyle(mockCell({isDim: () => 1}))
      expect(style.dim).toBe(true)
    })

    it('italic', () => {
      const style = xtermCellToStyle(mockCell({isItalic: () => 1}))
      expect(style.italic).toBe(true)
    })

    it('underline', () => {
      const style = xtermCellToStyle(mockCell({isUnderline: () => 1}))
      expect(style.underline).toBe(true)
    })

    it('inverse', () => {
      const style = xtermCellToStyle(mockCell({isInverse: () => 1}))
      expect(style.inverse).toBe(true)
    })

    it('blink', () => {
      const style = xtermCellToStyle(mockCell({isBlink: () => 1}))
      expect(style.blink).toBe(true)
    })

    it('invisible', () => {
      const style = xtermCellToStyle(mockCell({isInvisible: () => 1}))
      expect(style.invisible).toBe(true)
    })

    it('strikethrough', () => {
      const style = xtermCellToStyle(mockCell({isStrikethrough: () => 1}))
      expect(style.strikeout).toBe(true)
    })

    it('multiple attributes', () => {
      const style = xtermCellToStyle(
        mockCell({
          isBold: () => 1,
          isItalic: () => 1,
          isUnderline: () => 1,
        }),
      )
      expect(style.bold).toBe(true)
      expect(style.italic).toBe(true)
      expect(style.underline).toBe(true)
    })
  })

  describe('palette colors (256-color)', () => {
    it('foreground palette color', () => {
      const style = xtermCellToStyle(
        mockCell({
          getFgColor: () => 196,
          getFgColorMode: () => CM_PALETTE,
        }),
      )
      expect(style.foreground).toEqual({sgr: 196})
    })

    it('background palette color', () => {
      const style = xtermCellToStyle(
        mockCell({
          getBgColor: () => 42,
          getBgColorMode: () => CM_PALETTE,
        }),
      )
      expect(style.background).toEqual({sgr: 42})
    })
  })

  describe('RGB colors (24-bit)', () => {
    it('foreground RGB color', () => {
      // Pack RGB: (255 << 16) | (128 << 8) | 0 = 16744448
      const packed = (255 << 16) | (128 << 8) | 0
      const style = xtermCellToStyle(
        mockCell({
          getFgColor: () => packed,
          getFgColorMode: () => CM_RGB,
        }),
      )
      expect(style.foreground).toEqual([255, 128, 0])
    })

    it('background RGB color', () => {
      const packed = (0 << 16) | (255 << 8) | 128
      const style = xtermCellToStyle(
        mockCell({
          getBgColor: () => packed,
          getBgColorMode: () => CM_RGB,
        }),
      )
      expect(style.background).toEqual([0, 255, 128])
    })

    it('pure white RGB', () => {
      const packed = (255 << 16) | (255 << 8) | 255
      const style = xtermCellToStyle(
        mockCell({
          getFgColor: () => packed,
          getFgColorMode: () => CM_RGB,
        }),
      )
      expect(style.foreground).toEqual([255, 255, 255])
    })

    it('pure black RGB', () => {
      const style = xtermCellToStyle(
        mockCell({
          getFgColor: () => 0,
          getFgColorMode: () => CM_RGB,
        }),
      )
      expect(style.foreground).toEqual([0, 0, 0])
    })
  })

  describe('combined attributes and colors', () => {
    it('bold red foreground on blue background', () => {
      const style = xtermCellToStyle(
        mockCell({
          isBold: () => 1,
          getFgColor: () => 1, // red in 256-color palette
          getFgColorMode: () => CM_PALETTE,
          getBgColor: () => 4, // blue in 256-color palette
          getBgColorMode: () => CM_PALETTE,
        }),
      )
      expect(style.bold).toBe(true)
      expect(style.foreground).toEqual({sgr: 1})
      expect(style.background).toEqual({sgr: 4})
    })
  })
})

describe('StyleCache', () => {
  it('returns Style.NONE for default cells', () => {
    const cache = new StyleCache()
    const style = cache.styleForCell(mockCell())
    expect(style).toBe(Style.NONE)
  })

  it('returns the same instance for identical cells', () => {
    const cache = new StyleCache()
    const cell1 = mockCell({isBold: () => 1})
    const cell2 = mockCell({isBold: () => 1})
    const style1 = cache.styleForCell(cell1)
    const style2 = cache.styleForCell(cell2)
    expect(style1).toBe(style2) // same reference
    expect(style1.bold).toBe(true)
  })

  it('returns different instances for different styles', () => {
    const cache = new StyleCache()
    const bold = cache.styleForCell(mockCell({isBold: () => 1}))
    const italic = cache.styleForCell(mockCell({isItalic: () => 1}))
    expect(bold).not.toBe(italic)
    expect(bold.bold).toBe(true)
    expect(italic.italic).toBe(true)
  })

  it('caches palette color styles', () => {
    const cache = new StyleCache()
    const cell = mockCell({
      getFgColor: () => 196,
      getFgColorMode: () => CM_PALETTE,
    })
    const style1 = cache.styleForCell(cell)
    const style2 = cache.styleForCell(
      mockCell({
        getFgColor: () => 196,
        getFgColorMode: () => CM_PALETTE,
      }),
    )
    expect(style1).toBe(style2)
    expect(style1.foreground).toEqual({sgr: 196})
  })

  it('caches RGB color styles', () => {
    const cache = new StyleCache()
    const packed = (255 << 16) | (128 << 8) | 64
    const cell = mockCell({
      getFgColor: () => packed,
      getFgColorMode: () => CM_RGB,
    })
    const style1 = cache.styleForCell(cell)
    const style2 = cache.styleForCell(
      mockCell({
        getFgColor: () => packed,
        getFgColorMode: () => CM_RGB,
      }),
    )
    expect(style1).toBe(style2)
    expect(style1.foreground).toEqual([255, 128, 64])
  })

  it('differentiates palette colors from RGB with same numeric value', () => {
    const cache = new StyleCache()
    const palette = cache.styleForCell(
      mockCell({
        getFgColor: () => 196,
        getFgColorMode: () => CM_PALETTE,
      }),
    )
    const rgb = cache.styleForCell(
      mockCell({
        getFgColor: () => 196,
        getFgColorMode: () => CM_RGB,
      }),
    )
    expect(palette).not.toBe(rgb)
  })

  it('tracks cache size', () => {
    const cache = new StyleCache()
    expect(cache.size).toBe(1) // Style.NONE pre-populated
    cache.styleForCell(mockCell({isBold: () => 1}))
    expect(cache.size).toBe(2)
    // Same style doesn't increase size
    cache.styleForCell(mockCell({isBold: () => 1}))
    expect(cache.size).toBe(2)
  })

  it('clear resets to just Style.NONE', () => {
    const cache = new StyleCache()
    cache.styleForCell(mockCell({isBold: () => 1}))
    cache.styleForCell(mockCell({isItalic: () => 1}))
    expect(cache.size).toBe(3)
    cache.clear()
    expect(cache.size).toBe(1)
    // Style.NONE still works after clear
    expect(cache.styleForCell(mockCell())).toBe(Style.NONE)
  })

  it('caches combined attributes + colors', () => {
    const cache = new StyleCache()
    const cell = mockCell({
      isBold: () => 1,
      isUnderline: () => 1,
      getFgColor: () => 42,
      getFgColorMode: () => CM_PALETTE,
      getBgColor: () => (30 << 16) | (60 << 8) | 90,
      getBgColorMode: () => CM_RGB,
    })
    const style1 = cache.styleForCell(cell)
    const style2 = cache.styleForCell(
      mockCell({
        isBold: () => 1,
        isUnderline: () => 1,
        getFgColor: () => 42,
        getFgColorMode: () => CM_PALETTE,
        getBgColor: () => (30 << 16) | (60 << 8) | 90,
        getBgColorMode: () => CM_RGB,
      }),
    )
    expect(style1).toBe(style2)
    expect(style1.bold).toBe(true)
    expect(style1.underline).toBe(true)
    expect(style1.foreground).toEqual({sgr: 42})
    expect(style1.background).toEqual([30, 60, 90])
  })

  it('all 8 attribute flags produce unique keys', () => {
    const cache = new StyleCache()
    const styles = [
      cache.styleForCell(mockCell({isBold: () => 1})),
      cache.styleForCell(mockCell({isDim: () => 1})),
      cache.styleForCell(mockCell({isItalic: () => 1})),
      cache.styleForCell(mockCell({isUnderline: () => 1})),
      cache.styleForCell(mockCell({isInverse: () => 1})),
      cache.styleForCell(mockCell({isBlink: () => 1})),
      cache.styleForCell(mockCell({isInvisible: () => 1})),
      cache.styleForCell(mockCell({isStrikethrough: () => 1})),
    ]
    // All 8 should be distinct + 1 for Style.NONE = 9
    expect(cache.size).toBe(9)
    // Each pair should be different references
    for (let i = 0; i < styles.length; i++) {
      for (let j = i + 1; j < styles.length; j++) {
        expect(styles[i]).not.toBe(styles[j])
      }
    }
  })
})
