import {describe, expect, it} from 'vitest'
import {
  ansiLocations,
  charWidth,
  lineWidth,
  printableChars,
  removeAnsi,
  words,
} from '../src/unicode.js'

describe('OSC 8 tokenization', () => {
  for (const terminator of ['\x1b\\', '\x07', '\x9c']) {
    for (const url of [
      'file:///Users/colinta/hd/node_modules/.pnpm/@teaui+core@1.14.14/node_modules/@teaui/core',
      'file:///tmp/a(b)!c,d;é',
      'https://example.com/path?q=foo+bar&value=%20#fragment',
    ]) {
      it(`keeps the whole URI as a zero-width token (${JSON.stringify(terminator)}, ${url})`, () => {
        const open = `\x1b]8;id=test;${url}${terminator}`
        const close = `\x1b]8;;${terminator}`
        const input = `${open}some text${close}`
        expect(ansiLocations(input)).toEqual([
          {start: 0, stop: open.length, ansi: open},
          {start: open.length + 9, stop: input.length, ansi: close},
        ])
        expect(printableChars(input)).toEqual([open, ...'some text', close])
        expect(charWidth(open)).toBe(0)
        expect(lineWidth(input)).toBe(9)
        expect(removeAnsi(input)).toBe('some text')
        expect(words(input).flatMap(([chars]) => chars)).toEqual([
          open,
          ...'some text',
          close,
        ])
      })
    }
  }
})
