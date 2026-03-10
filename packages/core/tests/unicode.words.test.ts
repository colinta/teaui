import {describe, test, expect} from 'vitest'
import {words} from '@teaui/term'

function simpleWords(input: string) {
  return input.split(' ').reduce(
    ([acc, offset], word, index, words): [[string[], number][], number] => {
      acc.push([word.split(''), offset] as const)
      offset += word.length
      if (index < words.length - 1) {
        acc.push([[' '], offset] as const)
        offset += 1
      }
      return [acc, offset] as const
    },
    [[], 0] as [[string[], number][], number],
  )[0]
}

// desc, input, expected
const specs: [string, string, any][] = [
  ['one word', 'word', simpleWords('word')],
  ['two words', 'hello dolly', simpleWords('hello dolly')],
  ['ansi+word', '\x1b[0mhello', [[['\x1b[0m', 'h', 'e', 'l', 'l', 'o'], 0]]],
]

describe('words', () => {
  for (const [desc, input, expected] of specs) {
    test(desc, () => {
      const splitWords = words(input)
      expect(splitWords).toEqual(expected)
    })
  }
})
