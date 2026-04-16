import {describe, test, expect} from 'vitest'
import {
  wrap,
  leftPad,
  rightPad,
  centerPad,
  toPaddingEdges,
} from '../lib/util.js'
import {inspect} from '@teaui/inspect'

describe('leftPad', () => {
  test('pads a string to the requested width', () => {
    expect(leftPad('abc', 5)).toBe('  abc')
  })

  test('does not change strings that are already wide enough', () => {
    expect(leftPad('abc', 3)).toBe('abc')
    expect(leftPad('abc', 2)).toBe('abc')
  })

  test('pads each line independently', () => {
    expect(leftPad('a\nbb', 3)).toBe('  a\n bb')
  })
})

describe('rightPad', () => {
  test('pads a string to the requested width', () => {
    expect(rightPad('abc', 5)).toBe('abc  ')
  })

  test('does not change strings that are already wide enough', () => {
    expect(rightPad('abc', 3)).toBe('abc')
    expect(rightPad('abc', 2)).toBe('abc')
  })

  test('pads each line independently', () => {
    expect(rightPad('a\nbb', 3)).toBe('a  \nbb ')
  })
})

describe('centerPad', () => {
  test('pads a string evenly to the requested width', () => {
    expect(centerPad('abc', 7)).toBe('  abc  ')
  })

  test('puts the extra space on the right when padding is odd', () => {
    expect(centerPad('abc', 6)).toBe(' abc  ')
  })

  test('pads each line independently', () => {
    expect(centerPad('a\nbb', 4)).toBe(' a  \n bb ')
  })

  test('does not change strings that are already wide enough', () => {
    expect(centerPad('abc', 3)).toBe('abc')
    expect(centerPad('abc', 2)).toBe('abc')
  })
})

describe('toPaddingEdges', () => {
  test('returns undefined when neither edges nor defaults are provided', () => {
    expect(toPaddingEdges(undefined)).toBeUndefined()
  })

  test('expands a number to all edges', () => {
    expect(toPaddingEdges(2)).toEqual({
      top: 2,
      right: 2,
      bottom: 2,
      left: 2,
    })
  })

  test('allows per-edge defaults to override a numeric padding value', () => {
    expect(toPaddingEdges(5, 0, undefined, 1)).toEqual({
      top: 0,
      right: 5,
      bottom: 1,
      left: 5,
    })
  })

  test('fills missing edge values from per-edge defaults', () => {
    expect(toPaddingEdges({top: 1, left: 3}, undefined, 2, 4)).toEqual({
      top: 1,
      right: 2,
      bottom: 4,
      left: 3,
    })
  })

  test('uses object edge values over per-edge defaults', () => {
    expect(toPaddingEdges({top: 5}, 0)).toEqual({
      top: 5,
      right: 0,
      bottom: 0,
      left: 0,
    })
  })

  test('can build edges from per-edge defaults alone', () => {
    expect(toPaddingEdges(undefined, 1, 2, 3, 4)).toEqual({
      top: 1,
      right: 2,
      bottom: 3,
      left: 4,
    })
  })

  test('treats zero as a valid numeric padding value', () => {
    expect(toPaddingEdges(0)).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    })
  })
})

// desc+width, input, expected characters
const specs: [[string, number], string, [string, number][]][] = [
  [
    ['width:1 w/ lots of ansi', 1],
    inspect({a: 1, b: [2], c: '3'}),
    [
      '{',
      '\x1b[36ma\x1b[0m',
      ':',
      '\x1b[33m1\x1b[0m',
      ',',
      '\x1b[36mb\x1b[0m',
      ':',
      '[',
      '\x1b[33m2\x1b[0m',
      ']',
      ',',
      '\x1b[36mc\x1b[0m',
      ':',
      "\x1b[32m'",
      '3',
      "'\x1b[0m",
      '}',
    ].map(char => [char, 1]),
  ],
]

describe('wrap', () => {
  for (const [[desc, width], input, expected] of specs) {
    test(desc, () => {
      const actual = wrap(input, width)
      expect(actual).toEqual(expected)
    })
  }

  test('returns an empty array when content width is zero', () => {
    expect(wrap('abc', 0)).toEqual([])
  })

  test('wraps plain strings by word', () => {
    expect(wrap('one two three', 7)).toEqual([
      ['one two', 7],
      ['three', 5],
    ])
  })

  test('wraps long words by character width', () => {
    expect(wrap('abcdef', 3)).toEqual([
      ['abc', 3],
      ['def', 3],
    ])
  })

  test('accepts arrays of strings', () => {
    expect(wrap(['ab cd', 'ef'], 3)).toEqual([
      ['ab', 2],
      ['cd', 2],
      ['ef', 2],
    ])
  })

  test('accepts arrays of [string, width] tuples', () => {
    expect(
      wrap(
        [
          ['ab cd', 5],
          ['ef', 2],
        ],
        3,
      ),
    ).toEqual([
      ['ab', 2],
      ['cd', 2],
      ['ef', 2],
    ])
  })
})
