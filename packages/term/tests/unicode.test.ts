import {describe, expect, it} from 'vitest'
import {
  ansiLocations,
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
      expect(charWidth('\t')).toBe(2)
      expect(charWidth('界')).toBe(2)
      expect(charWidth('🧑‍🧑‍🧒‍🧒')).toBe(2)
      expect(charWidth('🙂')).toBe(2)
      expect(charWidth(RED)).toBe(0)
    })

    it('measures combining marks as zero width', () => {
      expect(charWidth('\u0301')).toBe(0)
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
    it('ignores ANSI sequences and stops at the first newline', () => {
      expect(lineWidth(`a${RED}界${RESET}\nabcdef`)).toBe(3)
    })

    it('counts square emoji variants as double-width', () => {
      expect(lineWidth('⬜︎╶──╴')).toBe(6)
      expect(lineWidth('╶──╴⬛︎')).toBe(6)
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
