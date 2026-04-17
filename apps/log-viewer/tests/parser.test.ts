import {describe, test, expect} from 'vitest'
import {
  parseFilter,
  matchFilter,
  type FilterNode,
  type ParseResult,
} from '../parser.js'

function parse(filter: string): FilterNode | undefined {
  const result = parseFilter(filter)
  if (!result) return undefined
  if (result.type === 'failure') return undefined
  return result.node
}

function matches(filter: string, text: string): boolean {
  const result = parseFilter(filter)
  if (!result || result.type === 'failure') return true
  return matchFilter(result.node, text)
}

describe('parseFilter', () => {
  test('empty string returns undefined', () => {
    expect(parseFilter('')).toBeUndefined()
    expect(parseFilter('   ')).toBeUndefined()
  })

  test('single word', () => {
    expect(parse('foo')).toEqual({type: 'word', value: 'foo', lower: 'foo'})
  })

  test('quoted string', () => {
    expect(parse('"hello world"')).toEqual({
      type: 'quoted',
      value: 'hello world',
      lower: 'hello world',
    })
  })

  test('single-quoted string', () => {
    expect(parse("'hello world'")).toEqual({
      type: 'quoted',
      value: 'hello world',
      lower: 'hello world',
    })
  })

  test('regex', () => {
    expect(parse('/\\d+/')).toEqual({type: 'regex', value: /\d+/})
  })

  test('regex with flags', () => {
    expect(parse('/foo/gi')).toEqual({type: 'regex', value: /foo/gi})
  })

  test('sequence of words', () => {
    expect(parse('foo bar baz')).toEqual({
      type: 'sequence',
      nodes: [
        {type: 'word', value: 'foo', lower: 'foo'},
        {type: 'word', value: 'bar', lower: 'bar'},
        {type: 'word', value: 'baz', lower: 'baz'},
      ],
    })
  })

  test('AND expression', () => {
    expect(parse('foo AND bar')).toEqual({
      type: 'and',
      left: {type: 'word', value: 'foo', lower: 'foo'},
      right: {type: 'word', value: 'bar', lower: 'bar'},
    })
  })

  test('OR expression', () => {
    expect(parse('foo OR bar')).toEqual({
      type: 'or',
      left: {type: 'word', value: 'foo', lower: 'foo'},
      right: {type: 'word', value: 'bar', lower: 'bar'},
    })
  })

  test('OR has lower precedence than AND', () => {
    expect(parse('a AND b OR c AND d')).toEqual({
      type: 'or',
      left: {
        type: 'and',
        left: {type: 'word', value: 'a', lower: 'a'},
        right: {type: 'word', value: 'b', lower: 'b'},
      },
      right: {
        type: 'and',
        left: {type: 'word', value: 'c', lower: 'c'},
        right: {type: 'word', value: 'd', lower: 'd'},
      },
    })
  })

  test('AND has lower precedence than sequence', () => {
    expect(parse('a b AND c d')).toEqual({
      type: 'and',
      left: {
        type: 'sequence',
        nodes: [
          {type: 'word', value: 'a', lower: 'a'},
          {type: 'word', value: 'b', lower: 'b'},
        ],
      },
      right: {
        type: 'sequence',
        nodes: [
          {type: 'word', value: 'c', lower: 'c'},
          {type: 'word', value: 'd', lower: 'd'},
        ],
      },
    })
  })

  test('parenthesized group', () => {
    expect(parse('(foo OR bar) AND baz')).toEqual({
      type: 'and',
      left: {
        type: 'or',
        left: {type: 'word', value: 'foo', lower: 'foo'},
        right: {type: 'word', value: 'bar', lower: 'bar'},
      },
      right: {type: 'word', value: 'baz', lower: 'baz'},
    })
  })

  test('mixed tokens in sequence', () => {
    expect(parse('error "not found" /\\d+/')).toEqual({
      type: 'sequence',
      nodes: [
        {type: 'word', value: 'error', lower: 'error'},
        {type: 'quoted', value: 'not found', lower: 'not found'},
        {type: 'regex', value: /\d+/},
      ],
    })
  })

  test('unclosed quote is tolerated', () => {
    expect(parse('"hello')).toEqual({
      type: 'quoted',
      value: 'hello',
      lower: 'hello',
    })
  })
})

describe('parseFilter — error cases', () => {
  test('trailing AND returns failure', () => {
    const result = parseFilter('foo AND')
    expect(result).toEqual({
      type: 'failure',
      error: 'Expected expression after AND',
    })
  })

  test('trailing OR returns failure', () => {
    const result = parseFilter('foo OR')
    expect(result).toEqual({
      type: 'failure',
      error: 'Expected expression after OR',
    })
  })

  test('leading AND returns failure', () => {
    const result = parseFilter('AND foo')
    expect(result).toEqual({
      type: 'failure',
      error: 'Empty expression',
    })
  })

  test('leading OR returns failure', () => {
    const result = parseFilter('OR foo')
    expect(result).toEqual({
      type: 'failure',
      error: 'Empty expression',
    })
  })

  test('unclosed paren returns failure with partial parse', () => {
    const result = parseFilter('(foo OR bar')
    expect(result?.type).toBe('failure')
  })

  test('empty parens returns failure', () => {
    const result = parseFilter('()')
    expect(result?.type).toBe('failure')
  })
})

describe('matchFilter — words', () => {
  test('case-insensitive match', () => {
    expect(matches('error', 'An Error occurred')).toBe(true)
    expect(matches('ERROR', 'An error occurred')).toBe(true)
  })

  test('no match', () => {
    expect(matches('missing', 'An error occurred')).toBe(false)
  })
})

describe('matchFilter — quoted', () => {
  test('exact substring', () => {
    expect(matches('"or occ"', 'An error occurred')).toBe(true)
    expect(matches('"error occurred"', 'An error occurred')).toBe(true)
  })

  test('no match when words are not adjacent', () => {
    expect(matches('"an occurred"', 'An error occurred')).toBe(false)
  })
})

describe('matchFilter — regex', () => {
  test('regex match', () => {
    expect(matches('/err\\w+/', 'An error occurred')).toBe(true)
  })

  test('regex no match', () => {
    expect(matches('/^error$/', 'An error occurred')).toBe(false)
  })
})

describe('matchFilter — sequence (ordered)', () => {
  test('words in order match', () => {
    expect(matches('foo bar', 'foo then bar')).toBe(true)
  })

  test('words out of order do not match', () => {
    expect(matches('bar foo', 'foo then bar')).toBe(false)
  })

  test('three words in order', () => {
    expect(matches('a b c', 'a x b x c')).toBe(true)
    expect(matches('a c b', 'a x b x c')).toBe(false)
  })

  test('repeated word advances position', () => {
    expect(matches('a a', 'a b a')).toBe(true)
    expect(matches('a a', 'a b c')).toBe(false)
  })

  test('sequence with quoted token', () => {
    expect(matches('start "the end"', 'start of the end')).toBe(true)
    expect(matches('"the end" start', 'start of the end')).toBe(false)
  })
})

describe('matchFilter — AND (unordered)', () => {
  test('both present, any order', () => {
    expect(matches('bar AND foo', 'foo then bar')).toBe(true)
    expect(matches('foo AND bar', 'foo then bar')).toBe(true)
  })

  test('one missing fails', () => {
    expect(matches('foo AND missing', 'foo then bar')).toBe(false)
  })
})

describe('matchFilter — OR', () => {
  test('either present matches', () => {
    expect(matches('foo OR missing', 'foo then bar')).toBe(true)
    expect(matches('missing OR bar', 'foo then bar')).toBe(true)
  })

  test('neither present fails', () => {
    expect(matches('x OR y', 'foo then bar')).toBe(false)
  })
})

describe('matchFilter — compound expressions', () => {
  test('(error OR warn) AND /shop_\\d+/', () => {
    expect(matches('(error OR warn) AND /shop_\\d+/', 'error in shop_42')).toBe(
      true,
    )
    expect(
      matches('(error OR warn) AND /shop_\\d+/', 'warn about shop_7'),
    ).toBe(true)
    expect(
      matches('(error OR warn) AND /shop_\\d+/', 'info about shop_7'),
    ).toBe(false)
    expect(matches('(error OR warn) AND /shop_\\d+/', 'error no shop')).toBe(
      false,
    )
  })

  test('sequence inside AND', () => {
    expect(matches('hello world AND foo', 'foo hello world')).toBe(true)
    expect(matches('hello world AND foo', 'hello foo world')).toBe(true)
    expect(matches('hello world AND foo', 'foo world hello')).toBe(false)
  })

  test('nested parens', () => {
    expect(matches('(a OR b) AND (c OR d)', 'a and c')).toBe(true)
    expect(matches('(a OR b) AND (c OR d)', 'b and d')).toBe(true)
    expect(matches('(a OR b) AND (c OR d)', 'x with e')).toBe(false)
  })
})
