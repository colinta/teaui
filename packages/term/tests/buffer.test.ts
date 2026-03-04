import { describe, it, expect } from 'vitest'
import { ScreenBuffer } from '../src/buffer.js'
import { CSI } from '../src/ansi.js'

function flush(buf: ScreenBuffer): string {
  let output = ''
  buf.flush((s: string) => {
    output += s
  })
  return output
}

// Sync wrapper sequences (from modern.ts)
const SYNC_START = `${CSI}?2026h`
const SYNC_END = `${CSI}?2026l`

function moveTo(x: number, y: number): string {
  return `${CSI}${y + 1};${x + 1}H`
}

const RESET = `${CSI}0m`

describe('ScreenBuffer', () => {
  describe('basic write and flush', () => {
    it('writes a single character', () => {
      const buf = new ScreenBuffer(10, 5)
      buf.write('A', '')
      const out = flush(buf)
      expect(out).toBe(`${SYNC_START}${moveTo(0, 0)}A${SYNC_END}`)
    })

    it('writes a string at cursor position', () => {
      const buf = new ScreenBuffer(10, 5)
      buf.moveTo(3, 2)
      buf.write('Hi', '')
      const out = flush(buf)
      expect(out).toBe(`${SYNC_START}${moveTo(3, 2)}Hi${SYNC_END}`)
    })

    it('writes with style', () => {
      const buf = new ScreenBuffer(10, 5)
      const style = `${CSI}1m`
      buf.write('B', style)
      const out = flush(buf)
      expect(out).toBe(
        `${SYNC_START}${moveTo(0, 0)}${style}B${RESET}${SYNC_END}`,
      )
    })

    it('second flush with no changes produces no output', () => {
      const buf = new ScreenBuffer(10, 5)
      buf.write('X', '')
      flush(buf) // first flush syncs front
      const out = flush(buf)
      expect(out).toBe('')
    })
  })

  describe('diffing', () => {
    it('only writes changed cells', () => {
      const buf = new ScreenBuffer(10, 5)
      buf.write('ABC', '')
      flush(buf) // sync front

      // Change only the middle character
      buf.moveTo(1, 0)
      buf.write('X', '')
      const out = flush(buf)
      expect(out).toBe(`${SYNC_START}${moveTo(1, 0)}X${SYNC_END}`)
    })

    it('batches consecutive dirty cells without extra moveTo', () => {
      const buf = new ScreenBuffer(10, 5)
      buf.write('ABCDE', '')
      flush(buf)

      buf.moveTo(1, 0)
      buf.write('XY', '')
      const out = flush(buf)
      // Should have one moveTo then both chars, not two moveTos
      expect(out).toBe(`${SYNC_START}${moveTo(1, 0)}XY${SYNC_END}`)
    })

    it('inserts moveTo between non-consecutive dirty cells', () => {
      const buf = new ScreenBuffer(10, 5)
      buf.write('ABCDE', '')
      flush(buf)

      buf.moveTo(0, 0)
      buf.write('X', '')
      buf.moveTo(4, 0)
      buf.write('Y', '')
      const out = flush(buf)
      expect(out).toBe(
        `${SYNC_START}${moveTo(0, 0)}X${moveTo(4, 0)}Y${SYNC_END}`,
      )
    })

    it('handles dirty cells on different rows', () => {
      const buf = new ScreenBuffer(10, 5)
      flush(buf) // empty initial

      buf.moveTo(0, 0)
      buf.write('A', '')
      buf.moveTo(0, 2)
      buf.write('B', '')
      const out = flush(buf)
      expect(out).toBe(
        `${SYNC_START}${moveTo(0, 0)}A${moveTo(0, 2)}B${SYNC_END}`,
      )
    })
  })

  describe('style transitions', () => {
    it('resets style between different styled regions', () => {
      const buf = new ScreenBuffer(10, 5)
      const red = `${CSI}31m`
      const blue = `${CSI}34m`
      buf.write('A', red)
      buf.write('B', blue)
      const out = flush(buf)
      expect(out).toBe(
        `${SYNC_START}${moveTo(0, 0)}${red}A${RESET}${blue}B${RESET}${SYNC_END}`,
      )
    })

    it('does not re-emit same style for consecutive cells', () => {
      const buf = new ScreenBuffer(10, 5)
      const red = `${CSI}31m`
      buf.write('AB', red)
      const out = flush(buf)
      // Style emitted once, then both chars
      expect(out).toBe(
        `${SYNC_START}${moveTo(0, 0)}${red}AB${RESET}${SYNC_END}`,
      )
    })

    it('transitions from styled to unstyled', () => {
      const buf = new ScreenBuffer(10, 5)
      const bold = `${CSI}1m`
      buf.write('A', bold)
      buf.write('B', '')
      const out = flush(buf)
      expect(out).toBe(
        `${SYNC_START}${moveTo(0, 0)}${bold}A${RESET}B${SYNC_END}`,
      )
    })
  })

  describe('clear', () => {
    it('clears buffer and resets cursor', () => {
      const buf = new ScreenBuffer(5, 3)
      buf.moveTo(2, 1)
      buf.write('X', '')
      flush(buf)

      buf.clear()
      const out = flush(buf)
      // The 'X' cell should now be a space
      expect(out).toContain(moveTo(2, 1))
      expect(out).toContain(' ')

      // Cursor should be at 0,0
      expect(buf.cursorX).toBe(0)
      expect(buf.cursorY).toBe(0)
    })
  })

  describe('newline handling', () => {
    it('newline advances to next row column 0', () => {
      const buf = new ScreenBuffer(10, 5)
      buf.moveTo(3, 1)
      buf.write('A\nB', '')
      const out = flush(buf)
      // A at (3,1), B at (0,2)
      expect(out).toBe(
        `${SYNC_START}${moveTo(3, 1)}A${moveTo(0, 2)}B${SYNC_END}`,
      )
    })
  })

  describe('clipping', () => {
    it('clips writes beyond right edge', () => {
      const buf = new ScreenBuffer(3, 1)
      buf.write('ABCDE', '')
      const out = flush(buf)
      // Only first 3 chars should be written
      expect(out).toBe(`${SYNC_START}${moveTo(0, 0)}ABC${SYNC_END}`)
    })

    it('clips writes beyond bottom edge', () => {
      const buf = new ScreenBuffer(5, 2)
      buf.moveTo(0, 3) // beyond bottom
      buf.write('X', '')
      const out = flush(buf)
      expect(out).toBe('')
    })
  })

  describe('resize', () => {
    it('resizes and forces full redraw', () => {
      const buf = new ScreenBuffer(5, 3)
      buf.write('ABC', '')
      flush(buf)

      buf.resize(10, 5)
      // After resize, front is cleared so any writes are dirty
      buf.write('XY', '')
      const out = flush(buf)
      expect(out).toBe(`${SYNC_START}${moveTo(0, 0)}XY${SYNC_END}`)
    })
  })
})
