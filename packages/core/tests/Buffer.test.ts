import {describe, it, expect} from 'vitest'
import {Buffer} from '../lib/Buffer.js'
import {Size} from '../lib/geometry.js'
import {Style} from '../lib/Style.js'
import type {SGRTerminal} from '../lib/terminal.js'

class RecordingTerminal implements SGRTerminal {
  cols = 3
  rows = 1
  ops: string[] = []

  move(x: number, y: number): void {
    this.ops.push(`move:${x},${y}`)
  }

  write(str: string): void {
    this.ops.push(`write:${str}`)
  }

  flush(): void {
    this.ops.push('flush')
  }
}

describe('Buffer', () => {
  it.each([undefined, 1, 2] as const)(
    'stores and emits tabs as a single space with known width %s',
    knownWidth => {
      const buffer = new Buffer()
      const terminal = new RecordingTerminal()
      buffer.resize(new Size(3, 1))
      buffer.writeChar('a', 0, 0, Style.NONE)
      buffer.writeChar('\t', 1, 0, Style.NONE, knownWidth)
      buffer.writeChar('b', 2, 0, Style.NONE)
      buffer.flush(terminal)

      expect(terminal.ops).toEqual([
        'move:0,0',
        'write:a',
        'write: ',
        'write:b',
        'flush',
      ])
      expect(buffer.snapshot()).not.toContain('\t')
    },
  )

  it('realigns the cursor after writing annoying-width characters', () => {
    const buffer = new Buffer()
    const terminal = new RecordingTerminal()

    buffer.resize(new Size(3, 1))
    buffer.writeChar('⬜︎', 0, 0, Style.NONE)
    buffer.writeChar('X', 2, 0, Style.NONE)
    buffer.flush(terminal)

    expect(terminal.ops).toEqual([
      'move:0,0',
      'write:⬜︎',
      'move:2,0',
      'write:X',
      'flush',
    ])
  })
})
