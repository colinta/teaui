import {describe, test, expect} from 'vitest'
import {wrap} from '../lib/util.js'
import {inspect} from '../lib/inspect.js'

// desc+width, input, expected characters
const specs: [[string, number], string, any][] = [
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
})
