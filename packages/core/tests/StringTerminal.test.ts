import {describe, it, expect} from 'vitest'
import {StringTerminal} from '../lib/StringTerminal.js'

describe('StringTerminal', () => {
  it('stores cols and rows', () => {
    const term = new StringTerminal({cols: 80, rows: 24})
    expect(term.cols).toBe(80)
    expect(term.rows).toBe(24)
  })

  it('starts with blank grid output', () => {
    const term = new StringTerminal({cols: 3, rows: 2})
    // 3 spaces per row, 2 rows, joined with \n, plus \u001b[0m reset
    expect(term.output).toBe('   \n   \u001b[0m')
  })

  it('captures write() at cursor position', () => {
    const term = new StringTerminal({cols: 10, rows: 1})
    term.move(0, 0)
    term.write('hi')
    expect(term.output).toBe('hi        \u001b[0m')
  })

  it('move() positions cursor for subsequent writes', () => {
    const term = new StringTerminal({cols: 10, rows: 2})
    term.move(0, 0)
    term.write('A')
    term.move(5, 1)
    term.write('B')
    const lines = term.output.replace('\u001b[0m', '').split('\n')
    expect(lines[0]).toBe('A         ')
    expect(lines[1]).toBe('     B    ')
  })

  it('captures ANSI SGR codes attached to characters', () => {
    const term = new StringTerminal({cols: 5, rows: 1})
    term.move(0, 0)
    term.write('\u001b[31m')
    term.write('R')
    term.write('\u001b[0m')
    term.write('N')
    // Cell 0 gets the \u001b[31m prefix, cell 1 gets \u001b[0m prefix
    expect(term.output).toBe('\u001b[31mR\u001b[0mN   \u001b[0m')
  })

  it('handles multi-char writes', () => {
    const term = new StringTerminal({cols: 10, rows: 1})
    term.move(2, 0)
    term.write('abc')
    const line = term.output.replace('\u001b[0m', '')
    expect(line).toBe('  abc     ')
  })

  it('handles mixed SGR and text in single write', () => {
    const term = new StringTerminal({cols: 10, rows: 1})
    term.move(0, 0)
    term.write('\u001b[1mHi\u001b[0m')
    const out = term.output.replace(/\u001b\[0m$/, '')
    // 'H' has \u001b[1m, 'i' has nothing, then \u001b[0m goes on next char
    expect(out.startsWith('\u001b[1mH')).toBe(true)
  })

  it('reset() clears the grid', () => {
    const term = new StringTerminal({cols: 5, rows: 1})
    term.move(0, 0)
    term.write('hello')
    term.reset()
    expect(term.output).toBe('     \u001b[0m')
  })

  it('flush() is a no-op (does not throw)', () => {
    const term = new StringTerminal({cols: 5, rows: 1})
    term.flush()
    expect(term.output).toBe('     \u001b[0m')
  })

  it('out-of-bounds writes are ignored', () => {
    const term = new StringTerminal({cols: 3, rows: 1})
    term.move(5, 0)
    term.write('X')
    expect(term.output).toBe('   \u001b[0m')
  })
})
