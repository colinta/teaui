import {describe, expect, it, vi} from 'vitest'
import {removeAnsi} from '@teaui/term'
import {Buffer} from '../lib/Buffer.js'
import {Text} from '../lib/components/Text.js'
import {Viewport} from '../lib/Viewport.js'
import {Screen} from '../lib/Screen.js'
import {TestProgram} from '../lib/TestProgram.js'
import {TestTerminal} from '../lib/TestTerminal.js'
import {StringTerminal} from '../lib/StringTerminal.js'
import {renderToAnsi} from '../lib/renderToAnsi.js'
import {Style} from '../lib/Style.js'
import {Point, Size} from '../lib/geometry.js'

const ST = '\x1b\\'
const CLOSE = `\x1b]8;;${ST}`
const URL =
  'file:///Users/colinta/hd/node_modules/.pnpm/@teaui+core@1.14.14/node_modules/@teaui/core'
const OPEN = `\x1b]8;;${URL}${ST}`

function draw(
  input: string,
  width: number,
  useText: boolean,
  x = 0,
  height = 1,
  wrap = false,
) {
  const size = new Size(width, height)
  const text = new Text({
    text: input,
    wrap,
    alignment: x < 0 ? 'right' : 'left',
  })
  const screen = new Screen(new TestProgram({cols: width, rows: height}), text)
  const buffer = new Buffer()
  buffer.resize(size)
  const viewport = new Viewport(screen, buffer, size)
  const writeChar = vi.spyOn(buffer, 'writeChar')
  if (useText) {
    text.render(viewport)
  } else {
    viewport.write(input, new Point(x, 0))
  }
  const writes: string[] = []
  buffer.flush({
    cols: width,
    rows: height,
    move() {},
    flush() {},
    write: str => writes.push(str),
  })
  return {buffer, output: writes.join(''), writeChar}
}

function replay(ansi: string, width: number, height = 1) {
  const terminal = new TestTerminal({cols: width, rows: height})
  ansi.split('\n').forEach((line, y) => {
    terminal.move(0, y)
    terminal.write(line)
  })
  return terminal
}

for (const useText of [false, true]) {
  describe(useText ? 'Text clipping' : 'Viewport.write clipping', () => {
    it('preserves bold while truncating before its closing SGR', () => {
      const {buffer, output} = draw(
        '\x1b[1mtext to truncate\x1b[22m',
        7,
        useText,
      )
      expect(removeAnsi(output)).toBe('text to')
      expect(
        replay(buffer.snapshot(), 7).stylesMatch(
          0,
          0,
          7,
          style => style.bold === true,
        ),
      ).toBe(true)
      expect(output.endsWith('\x1b[0m')).toBe(true)
    })

    it('restores normal text after the bold span', () => {
      const {buffer} = draw('\x1b[1mtext\x1b[22m plain', 7, useText)
      const terminal = replay(buffer.snapshot(), 7)
      expect(terminal.textContent()).toBe('text pl')
      expect(terminal.styleAt(0, 0).bold).toBe(true)
      expect(terminal.styleAt(5, 0).bold).toBeFalsy()
    })

    it('truncates the label, never the OSC 8 URI, and closes at the right edge', () => {
      const {buffer, output, writeChar} = draw(
        `${OPEN}node_modules/.pnpm${CLOSE}`,
        7,
        useText,
      )
      expect(removeAnsi(output)).toBe('node_mo')
      expect(output).toBe(`${OPEN}node_mo${CLOSE}\x1b[0m`)
      expect(buffer.snapshot()).toBe(`\x1b[0m${OPEN}node_mo${CLOSE}\x1b[0m`)
      expect(
        writeChar.mock.calls.every(
          ([, , , style]) => style instanceof Style && style.link === URL,
        ),
      ).toBe(true)
    })

    it('opens at the first visible character when the beginning is clipped', () => {
      const {output} = draw(`${OPEN}abcdefghij${CLOSE}`, 5, useText, -5)
      expect(output).toBe(`${OPEN}fghij${CLOSE}\x1b[0m`)
    })

    it('closes before adjacent plain text', () => {
      const {output} = draw(`${OPEN}link${CLOSE} plain`, 10, useText)
      expect(output).toBe(`${OPEN}link${CLOSE} plain\x1b[0m`)
    })

    it('handles wide characters at the clipping boundary', () => {
      expect(draw(`${OPEN}a界b${CLOSE}`, 3, useText).output).toBe(
        `${OPEN}a界${CLOSE}\x1b[0m`,
      )
      expect(draw(`${OPEN}界${CLOSE}`, 1, useText).output).toBe(' ')
    })

    it('switches directly between distinct links without leaking into plain text', () => {
      const other = '\x1b]8;id=other;file:///other\x07'
      const {output} = draw(`${OPEN}one${other}two${CLOSE}!`, 7, useText)
      expect(output).toBe(
        `${OPEN}one${CLOSE}\x1b]8;id=other;file:///other${ST}two${CLOSE}!\x1b[0m`,
      )
    })

    it('does not lose bold when opening and closing a link', () => {
      const {output} = draw(`\x1b[1m${OPEN}a${CLOSE}b\x1b[22mc`, 3, useText)
      const terminal = replay(output, 3)
      expect(terminal.styleAt(0, 0)).toMatchObject({bold: true, link: URL})
      expect(terminal.styleAt(1, 0).bold).toBe(true)
      expect(terminal.styleAt(1, 0).link).toBeFalsy()
      expect(terminal.styleAt(2, 0).bold).toBeFalsy()
    })

    it('keeps the link across SGR changes and resets without reopening it', () => {
      const {output} = draw(`${OPEN}a\x1b[1mb\x1b[0mc${CLOSE}d`, 4, useText)
      expect(removeAnsi(output)).toBe('abcd')
      expect(output.split(OPEN)).toHaveLength(2)
      expect(output.split(CLOSE)).toHaveLength(2)
      const terminal = replay(output, 4)
      expect(terminal.stylesMatch(0, 0, 3, style => style.link === URL)).toBe(
        true,
      )
      expect(terminal.styleAt(1, 0).bold).toBe(true)
      expect(terminal.styleAt(2, 0).bold).toBeFalsy()
      expect(terminal.styleAt(3, 0).link).toBeFalsy()
    })
  })
}

describe('OSC 8 buffer state', () => {
  it('preserves truncated links in ANSI exports without leaking into later output', () => {
    const output = renderToAnsi(
      new Text({text: `${OPEN}node_modules${CLOSE}`}),
      {width: 5, height: 1},
    )
    expect(output).toBe(`${OPEN}node_${CLOSE}\x1b[0m`)
  })

  it('keeps StringTerminal links attached to cells, not their original position', () => {
    const terminal = new StringTerminal({cols: 4, rows: 1})
    terminal.write(`${OPEN}abcd${CLOSE}`)
    terminal.move(0, 0)
    terminal.write('X')
    expect(terminal.output).toBe(`X${OPEN}bcd${CLOSE}\x1b[0m`)
    terminal.move(2, 0)
    terminal.write('Y')
    expect(terminal.output).toBe(`X${OPEN}b${CLOSE}Y${OPEN}d${CLOSE}\x1b[0m`)
    terminal.reset()
    expect(terminal.output).toBe('    \x1b[0m')
  })

  it('retains links across wrapping, but balances snapshot rows', () => {
    const {buffer} = draw(`${OPEN}abcdefgh${CLOSE}`, 4, true, 0, 2, true)
    expect(buffer.snapshot()).toBe(
      [
        `\x1b[0m${OPEN}abcd${CLOSE}\x1b[0m`,
        `\x1b[0m${OPEN}efgh${CLOSE}\x1b[0m`,
      ].join('\n'),
    )
  })

  it('closes at the last written cell even when unchanged cells are skipped', () => {
    const buffer = new Buffer()
    buffer.resize(new Size(3, 1))
    const style = new Style({link: URL})
    const writes: string[] = []
    const terminal = {
      cols: 3,
      rows: 1,
      move() {},
      flush() {},
      write: (str: string) => writes.push(str),
    }
    for (const [x, char] of [...'abc'].entries()) {
      buffer.writeChar(char, x, 0, style)
    }
    buffer.flush(terminal)
    writes.length = 0
    for (const [x, char] of [...'aBc'].entries()) {
      buffer.writeChar(char, x, 0, style)
    }
    buffer.flush(terminal)
    expect(writes.join('')).toBe(`${OPEN}B${CLOSE}\x1b[0m`)
    writes.length = 0
    for (const [x, char] of [...'aBc'].entries()) {
      buffer.writeChar(char, x, 0, style)
    }
    buffer.flush(terminal)
    expect(writes).toEqual([])
  })

  it('redraws unchanged characters when only the link changes or is removed', () => {
    const buffer = new Buffer()
    buffer.resize(new Size(1, 1))
    const writes: string[] = []
    const terminal = {
      cols: 1,
      rows: 1,
      move() {},
      flush() {},
      write: (str: string) => writes.push(str),
    }
    buffer.writeChar('x', 0, 0, new Style({link: URL}))
    buffer.flush(terminal)
    writes.length = 0
    buffer.writeChar('x', 0, 0, new Style({link: 'file:///other'}))
    buffer.flush(terminal)
    expect(writes.join('')).toBe(`\x1b]8;;file:///other${ST}x${CLOSE}\x1b[0m`)
    writes.length = 0
    buffer.writeChar('x', 0, 0, Style.NONE)
    buffer.flush(terminal)
    expect(writes.join('')).toBe('x')
  })
})
