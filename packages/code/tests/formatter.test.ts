import {describe, it, expect} from 'vitest'
import {codeHighlighter} from '../lib/formatter.js'

describe('codeHighlighter', () => {
  it('returns a function', () => {
    const format = codeHighlighter('javascript')
    expect(typeof format).toBe('function')
  })

  it('adds ANSI codes to source code', () => {
    const format = codeHighlighter('javascript')
    const result = format('const x = 1')
    // Should contain ANSI escape sequences
    expect(result).toMatch(/\x1b\[/)
    // Should still contain the original text
    expect(result).toContain('const')
    expect(result).toContain('x')
    expect(result).toContain('1')
  })

  it('returns plain text on unknown language', () => {
    const format = codeHighlighter('nonexistent_language_xyz')
    const result = format('hello world')
    expect(result).toContain('hello world')
  })

  it('auto-detects language when none specified', () => {
    const format = codeHighlighter()
    const result = format('function foo() { return 42; }')
    // Should still contain ANSI codes from auto-detection
    expect(result).toMatch(/\x1b\[/)
  })

  it('works with Input format prop', () => {
    // Integration test: codeHighlighter returns a format function
    // compatible with Input's format prop signature
    const format = codeHighlighter('sql')
    const input = 'SELECT * FROM users'
    const result = format(input)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(input.length) // ANSI codes add length
  })
})
