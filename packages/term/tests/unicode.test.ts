import {describe, expect, it} from 'vitest'
import {
  ansiLocations,
  formatTabs,
  charWidth,
  isAnnoyingWidth,
  lineWidth,
  printableChars,
  removeAnsi,
  stringSize,
} from '../src/unicode.js'

const RED = '\x1b[31m'
const RESET = '\x1b[0m'

describe('unicode', () => {
  describe('charWidth', () => {
    it('measures control, ascii, tabs, CJK, and emoji characters', () => {
      expect(charWidth('')).toBe(0)
      expect(charWidth('\n')).toBe(0)
      expect(charWidth('a')).toBe(1)
      expect(charWidth('\t')).toBe(1)
      expect(charWidth('界')).toBe(2)
      expect(charWidth('🧑‍🧑‍🧒‍🧒')).toBe(2)
      expect(charWidth('🙂')).toBe(2)
      expect(charWidth(RED)).toBe(0)
    })

    it('measures every regional-indicator flag as double-width', () => {
      const regionalIndicators = Array.from({length: 26}, (_, index) =>
        String.fromCodePoint(0x1f1e6 + index),
      )

      for (const first of regionalIndicators) {
        for (const second of regionalIndicators) {
          expect(charWidth(first + second)).toBe(2)
        }
      }
    })

    it('measures clock emoji as double-width', () => {
      expect(charWidth('🕛')).toBe(2)
    })

    it('measures combining marks as zero width', () => {
      expect(charWidth('\u0301')).toBe(0)
    })

    it('counts spacing marks within a grapheme', () => {
      expect(printableChars('ดำ')).toEqual(['ดำ'])
      expect(charWidth('ดำ')).toBe(2)
      expect(charWidth('คำ')).toBe(2)
      expect(charWidth('นี้')).toBe(1)
    })

    it('treats black and white square emoji variants as double-width', () => {
      expect(charWidth('⬜︎')).toBe(2)
      expect(charWidth('⬛︎')).toBe(2)
    })

    it('keeps legacy square variants single-width', () => {
      expect(charWidth('▫️')).toBe(1)
      expect(charWidth('◻️')).toBe(1)
      expect(charWidth('◼︎')).toBe(1)
      expect(charWidth('▪️')).toBe(1)
      expect(charWidth('◼️')).toBe(1)
    })
  })

  describe('isAnnoyingWidth', () => {
    it('detects TeaUI glyphs with terminal-dependent width', () => {
      expect(isAnnoyingWidth('⬜︎')).toBe(true)
      expect(isAnnoyingWidth('⬛︎')).toBe(true)
      expect(isAnnoyingWidth('X')).toBe(false)
    })
  })

  describe('printableChars', () => {
    it('segments graphemes and ANSI escape sequences', () => {
      expect(printableChars(`a${RED}é🧑‍🧑‍🧒‍🧒🙂${RESET}b`)).toEqual([
        'a',
        RED,
        'é',
        '🧑‍🧑‍🧒‍🧒',
        '🙂',
        RESET,
        'b',
      ])
    })

    it('keeps square emoji variation sequences together', () => {
      expect(printableChars('⬜︎╶──╴')).toEqual(['⬜︎', '╶', '─', '─', '╴'])
      expect(printableChars('╶──╴⬛︎')).toEqual(['╶', '─', '─', '╴', '⬛︎'])
    })
  })

  describe('lineWidth', () => {
    it('counts unexpanded tabs as single spaces', () => {
      expect(lineWidth('\thello')).toBe(6)
      expect(lineWidth('1.\thello')).toBe(8)
      expect(lineWidth(['a', '\t', 'b'])).toBe(3)
      expect(stringSize('\thello\n1.\thello')).toEqual({width: 8, height: 2})
    })

    it('ignores ANSI sequences and stops at the first newline', () => {
      expect(lineWidth(`a${RED}界${RESET}\nabcdef`)).toBe(3)
    })

    it('counts square emoji variants as double-width', () => {
      expect(lineWidth('⬜︎╶──╴')).toBe(6)
      expect(lineWidth('╶──╴⬛︎')).toBe(6)
    })

    it('counts Thai spacing marks separately from their graphemes', () => {
      expect(lineWidth('เก็บ')).toBe(3)
      expect(lineWidth('เก็บคำ')).toBe(5)
      expect(
        lineWidth(
          'การดำเนินการนี้จะทำเครื่องหมายคำสั่งซื้อว่าจัดการแล้วและส่งการแจ้งเตือนไปยังลูกค้าของคุณ',
        ),
      ).toBe(69)
    })
  })

  describe('stringSize', () => {
    it('measures multiline strings', () => {
      expect(stringSize(`a${RED}b${RESET}\n界🙂`)).toEqual({
        width: 4,
        height: 2,
      })
    })

    it('accounts for wrapped height', () => {
      expect(stringSize(['abcdef', '界🙂'], 3)).toEqual({
        width: 6,
        height: 4,
      })
    })
  })

  describe('formatTabs', () => {
    it.each([
      ['', ''],
      ['no tabs', 'no tabs'],
      ['\thello', '    hello'],
      ['1.\thello', '1.  hello'],
      ['abc\tx', 'abc x'],
      ['1234\tx', '1234    x'],
      ['a\tb\t', 'a   b   '],
      ['\t\t', '        '],
      ['\tfoo\n1.\tbar\n', '    foo\n1.  bar\n'],
      ['a\r\n\tb', 'a\r\n    b'],
    ])('expands %j at four-cell stops', (input, expected) => {
      expect(formatTabs(input)).toBe(expected)
      expect(formatTabs(expected)).toBe(expected)
    })

    it.each([
      ['界', '  '],
      ['🙂', '  '],
      ['🇺🇸', '  '],
      ['👩‍💻', '  '],
      ['ดำ', '  '],
      ['e\u0301', '   '],
      ['นี้', '   '],
    ])('uses terminal cell widths after %j', (prefix, spaces) => {
      const expanded = formatTabs(prefix + '\tx')
      expect(expanded).toBe(prefix + spaces + 'x')
      expect(lineWidth(expanded)).toBe(5)
    })

    it('supports custom tab sizes', () => {
      expect(formatTabs('a\tb\tc', {tabSize: 2})).toBe('a b c')
      expect(formatTabs('a\tx', {tabSize: 8})).toBe('a       x')
      expect(formatTabs('a\t\tb', {tabSize: 1})).toBe('a  b')
    })

    it('applies the starting column only to the first line', () => {
      expect(formatTabs('\tx\n\tx', {startColumn: 2})).toBe('  x\n    x')
      expect(formatTabs('a\tx', {tabSize: 8, startColumn: 5})).toBe('a  x')
    })

    it('preserves ANSI styles without counting them as cells', () => {
      expect(formatTabs(`a${RED}\t界${RESET}\tZ`)).toBe(
        `a${RED}   界${RESET}  Z`,
      )
    })

    it('preserves hyperlink sequences without measuring their payloads', () => {
      const open = '\x1b]8;;https://example.com/界+🙂\x1b\\'
      const close = '\x1b]8;;\x1b\\'
      expect(formatTabs(`${open}a\tb${close}\tc`)).toBe(
        `${open}a   b${close}   c`,
      )
    })

    it('does not wrap long lines', () => {
      expect(formatTabs('abcdefghij\tx')).toBe('abcdefghij  x')
    })

    it.each([0, -1, 1.5, NaN, Infinity])(
      'rejects invalid tabSize %s',
      tabSize => {
        expect(() => formatTabs('\t', {tabSize})).toThrow(RangeError)
      },
    )

    it.each([-1, 1.5, NaN, Infinity])(
      'rejects invalid startColumn %s',
      startColumn => {
        expect(() => formatTabs('\t', {startColumn})).toThrow(RangeError)
      },
    )
  })

  describe('ANSI utilities', () => {
    it('finds and removes ANSI escape sequences', () => {
      const input = `a${RED}red${RESET}b`

      expect(ansiLocations(input)).toEqual([
        {start: 1, stop: 6, ansi: RED},
        {start: 9, stop: 13, ansi: RESET},
      ])
      expect(removeAnsi(input)).toBe('aredb')
    })
  })
})
