import {afterEach, describe, expect, it, vi} from 'vitest'
import {removeAnsi, lineWidth} from '@teaui/term'
import {Buffer} from '../lib/Buffer.js'
import {Size} from '../lib/geometry.js'
import {Style} from '../lib/Style.js'
import {TestTerminal} from '../lib/TestTerminal.js'
import {Screen} from '../lib/Screen.js'
import {TestProgram} from '../lib/TestProgram.js'
import {Text} from '../lib/components/Text.js'

afterEach(() => vi.restoreAllMocks())

describe('buffer snapshots', () => {
  it('returns empty text before flush, after invalidation, and after resize', () => {
    const buffer = new Buffer()
    const terminal = new TestTerminal({cols: 6, rows: 2})
    expect(buffer.snapshot()).toBe('')
    buffer.resize(new Size(6, 2))
    buffer.writeChar('A', 0, 0, Style.NONE)
    expect(buffer.snapshot()).toBe('')
    buffer.flush(terminal)
    expect(removeAnsi(buffer.snapshot())).toBe('A     \n      ')
    buffer.writeChar('B', 0, 0, Style.NONE)
    expect(removeAnsi(buffer.snapshot())).toBe('A     \n      ')
    buffer.invalidate()
    expect(buffer.snapshot()).toBe('')
    buffer.flush(terminal)
    expect(removeAnsi(buffer.snapshot())).toBe('B     \n      ')
    buffer.resize(new Size(3, 1))
    expect(buffer.snapshot()).toBe('')
  })

  it('preserves complete padded content when the terminal diff is unchanged', () => {
    const buffer = new Buffer()
    const terminal = new TestTerminal({cols: 6, rows: 3})
    buffer.resize(new Size(6, 3))
    buffer.writeChar('A', 1, 0, Style.NONE)
    buffer.writeChar('B', 4, 2, Style.NONE)
    buffer.flush(terminal)
    const snapshot = buffer.snapshot()
    expect(removeAnsi(snapshot)).toBe(' A    \n      \n    B ')
    buffer.writeChar('A', 1, 0, Style.NONE)
    buffer.writeChar('B', 4, 2, Style.NONE)
    const write = vi.spyOn(terminal, 'write')
    buffer.flush(terminal)
    expect(write).not.toHaveBeenCalled()
    expect(buffer.snapshot()).toBe(snapshot)
  })

  it('captures lazy paints and styles without terminal metadata', () => {
    const buffer = new Buffer()
    const terminal = new TestTerminal({cols: 6, rows: 2})
    buffer.resize(new Size(6, 2))
    buffer.paintRect(
      new Style({background: '#b5ff38', foreground: 'black'}),
      0,
      0,
      6,
      1,
    )
    buffer.paintRect(new Style({background: 'blue'}), 3, 0, 6, 1)
    buffer.writeChar('A', 1, 0, new Style({bold: true}))
    buffer.writeChar('B', 4, 0, new Style({underline: true, foreground: 'red'}))
    buffer.writeMeta('\x1b]0;private title\x07')
    buffer.flush(terminal)
    const ansi = buffer.snapshot()
    const plain = removeAnsi(ansi)
    expect(plain).toBe(' A  B \n      ')
    expect(ansi).toContain('\x1b[')
    expect(ansi).not.toContain('private title')
    expect(ansi).not.toContain('\x1b]')
    const replay = new TestTerminal({cols: 6, rows: 2})
    ansi.split('\n').forEach((row, y) => {
      replay.move(0, y)
      replay.write(row)
    })
    expect(replay.textRect(0, 0, 6, 2)).toBe(plain)
    expect(replay.styleAt(0, 0).background).toEqual([181, 255, 56])
    expect(replay.styleAt(1, 0)).toMatchObject({
      bold: true,
      foreground: 'black',
      background: [181, 255, 56],
    })
    expect(replay.styleAt(4, 0)).toMatchObject({
      underline: true,
      foreground: 'red',
      background: 'blue',
    })
  })

  it('keeps wide characters and grapheme clusters without duplicate cells', () => {
    const buffer = new Buffer()
    const terminal = new TestTerminal({cols: 10, rows: 1})
    buffer.resize(new Size(10, 1))
    buffer.writeChar('界', 0, 0, Style.NONE, 2)
    buffer.writeChar('👩‍💻', 2, 0, Style.NONE, 2)
    buffer.writeChar('e\u0301', 4, 0, Style.NONE, 1)
    buffer.writeChar('X', 7, 0, Style.NONE)
    buffer.writeChar('界', 9, 0, Style.NONE, 2)
    buffer.flush(terminal)
    const text = removeAnsi(buffer.snapshot())
    expect(text).toBe('界👩‍💻e\u0301  X  ')
    expect(lineWidth(text)).toBe(10)
  })

  it('does not disturb drawing or the diff cache', () => {
    const buffer = new Buffer()
    const terminal = new TestTerminal({cols: 4, rows: 1})
    buffer.resize(new Size(4, 1))
    buffer.writeChar('A', 0, 0, Style.NONE)
    buffer.flush(terminal)
    buffer.writeChar('B', 0, 0, Style.NONE)
    const flush = vi.spyOn(terminal, 'flush')
    const write = vi.spyOn(terminal, 'write')
    expect(removeAnsi(buffer.snapshot())).toBe('A   ')
    expect(flush).not.toHaveBeenCalled()
    expect(write).not.toHaveBeenCalled()
    buffer.flush(terminal)
    expect(removeAnsi(buffer.snapshot())).toBe('B   ')
  })

  it('lets Screen delegate without rendering, including an empty buffer', () => {
    const program = new TestProgram({cols: 10, rows: 2})
    const screen = new Screen(program, new Text({text: 'Hello'}))
    const render = vi.spyOn(screen, 'render')
    const flush = vi.spyOn(program, 'flush')
    expect(screen.snapshot()).toBe('')
    expect(render).not.toHaveBeenCalled()
    expect(flush).not.toHaveBeenCalled()
    screen.start()
    try {
      render.mockClear()
      flush.mockClear()
      const snapshot = screen.snapshot()
      expect(removeAnsi(snapshot)).toBe('Hello     \n          ')
      expect(screen.snapshot()).toBe(snapshot)
      expect(render).not.toHaveBeenCalled()
      expect(flush).not.toHaveBeenCalled()
    } finally {
      screen.stop()
    }
  })
})
