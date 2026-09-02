import {EventEmitter} from 'node:events'
import {describe, it, expect, vi} from 'vitest'
import {Terminal} from '../src/terminal.js'
import {CSI, ESC} from '../src/ansi.js'

function makeTerminal(
  options: {buffer?: boolean; stdin?: NodeJS.ReadableStream} = {},
) {
  let output = ''
  const stdout = {
    write(s: string) {
      output += s
      return true
    },
    columns: 80,
    rows: 24,
  }
  const term = new Terminal({stdout: stdout as any, ...options})
  return {term, getOutput: () => output, clearOutput: () => (output = '')}
}

function makeInput(isRaw: boolean = false) {
  const input = new EventEmitter() as EventEmitter & {
    isTTY: boolean
    isRaw: boolean
    setRawMode(mode: boolean): void
    resume: ReturnType<typeof vi.fn>
  }
  const rawModes: boolean[] = []

  input.isTTY = true
  input.isRaw = isRaw
  input.setRawMode = mode => {
    rawModes.push(mode)
    input.isRaw = mode
  }
  input.resume = vi.fn()

  return {input, rawModes}
}

describe('Terminal', () => {
  describe('style methods', () => {
    it('bold sets bold state', () => {
      const {term, getOutput} = makeTerminal()
      term.bold().write('hi')
      expect(getOutput()).toBe(`${CSI}1mhi${CSI}0m`)
    })

    it('dim sets dim state', () => {
      const {term, getOutput} = makeTerminal()
      term.dim().write('hi')
      expect(getOutput()).toBe(`${CSI}2mhi${CSI}0m`)
    })

    it('italic sets italic state', () => {
      const {term, getOutput} = makeTerminal()
      term.italic().write('hi')
      expect(getOutput()).toBe(`${CSI}3mhi${CSI}0m`)
    })

    it('underline sets underline state', () => {
      const {term, getOutput} = makeTerminal()
      term.underline().write('hi')
      expect(getOutput()).toBe(`${CSI}4mhi${CSI}0m`)
    })

    it('strikethrough sets strikethrough state', () => {
      const {term, getOutput} = makeTerminal()
      term.strikethrough().write('hi')
      expect(getOutput()).toBe(`${CSI}9mhi${CSI}0m`)
    })

    it('inverse sets inverse state', () => {
      const {term, getOutput} = makeTerminal()
      term.inverse().write('hi')
      expect(getOutput()).toBe(`${CSI}7mhi${CSI}0m`)
    })

    it('fg sets foreground color', () => {
      const {term, getOutput} = makeTerminal()
      term.fg('red').write('hi')
      expect(getOutput()).toBe(`${CSI}31mhi${CSI}0m`)
    })

    it('bg sets background color', () => {
      const {term, getOutput} = makeTerminal()
      term.bg('blue').write('hi')
      expect(getOutput()).toBe(`${CSI}44mhi${CSI}0m`)
    })

    it('multiple styles chain', () => {
      const {term, getOutput} = makeTerminal()
      term.bold().fg('green').write('hi')
      expect(getOutput()).toBe(`${CSI}1m${CSI}32mhi${CSI}0m`)
    })

    it('reset clears style state', () => {
      const {term, getOutput} = makeTerminal()
      term.bold().reset().write('hi')
      expect(getOutput()).toBe('hi')
    })

    it('write auto-resets style after output', () => {
      const {term, getOutput} = makeTerminal()
      term.bold().write('a')
      const first = getOutput()
      expect(first).toBe(`${CSI}1ma${CSI}0m`)
    })
  })

  describe('output methods', () => {
    it('write outputs styled text', () => {
      const {term, getOutput} = makeTerminal()
      term.write('hello')
      expect(getOutput()).toBe('hello')
    })

    it('writeln appends newline', () => {
      const {term, getOutput} = makeTerminal()
      term.writeln('hello')
      expect(getOutput()).toBe('hello\n')
    })

    it('writeRaw outputs without style', () => {
      const {term, getOutput} = makeTerminal()
      term.bold() // set style
      term.writeRaw('raw')
      expect(getOutput()).toBe('raw')
    })
  })

  describe('cursor delegation', () => {
    it('moveTo delegates', () => {
      const {term, getOutput} = makeTerminal()
      term.moveTo(5, 10)
      expect(getOutput()).toBe(`${CSI}11;6H`)
    })

    it('moveBy delegates', () => {
      const {term, getOutput} = makeTerminal()
      term.moveBy(3, -2)
      expect(getOutput()).toBe(`${CSI}2A${CSI}3C`)
    })

    it('saveCursor/restoreCursor delegates', () => {
      const {term, getOutput} = makeTerminal()
      term.saveCursor().restoreCursor()
      expect(getOutput()).toBe(`${ESC}7${ESC}8`)
    })

    it('showCursor/hideCursor delegates', () => {
      const {term, getOutput} = makeTerminal()
      term.showCursor().hideCursor()
      expect(getOutput()).toBe(`${CSI}?25h${CSI}?25l`)
    })
  })

  describe('screen delegation', () => {
    it('clear delegates', () => {
      const {term, getOutput} = makeTerminal()
      term.clear()
      expect(getOutput()).toBe(`${CSI}2J${CSI}1;1H`)
    })
  })

  describe('input lifecycle', () => {
    it('starts and restores raw input without changing the display buffer', () => {
      const {input, rawModes} = makeInput()
      const {term, getOutput} = makeTerminal({stdin: input as any})
      const events: unknown[] = []
      term.onInput(event => events.push(event))

      expect(term.startInput()).toBe(term)
      expect(getOutput()).toBe('')
      expect(rawModes).toEqual([true])
      expect(input.resume).toHaveBeenCalledOnce()

      input.emit('data', Buffer.from('a'))
      expect(events).toEqual([
        {
          type: 'key',
          key: 'a',
          ctrl: false,
          alt: false,
          shift: false,
          gui: false,
        },
      ])

      expect(term.stopInput()).toBe(term)
      expect(rawModes).toEqual([true, false])

      input.emit('data', Buffer.from('b'))
      expect(events).toHaveLength(1)
      expect(getOutput()).toBe('')
    })

    it('restores an input stream that was already in raw mode', () => {
      const {input, rawModes} = makeInput(true)
      const {term} = makeTerminal({stdin: input as any})

      term.startInput().stopInput()

      expect(rawModes).toEqual([true, true])
    })
  })

  describe('cursor position queries', () => {
    it('queries and parses a complete cursor-position response', async () => {
      const {input} = makeInput()
      const {term, getOutput} = makeTerminal({stdin: input as any})
      term.startInput()

      const position = term.queryCursorPosition(1000)
      expect(getOutput()).toBe(`${CSI}6n`)
      input.emit('data', Buffer.from(`${CSI}12;34R`))

      await expect(position).resolves.toEqual({x: 33, y: 11})
      term.stopInput()
    })

    it('parses fragmented responses while preserving interleaved input', async () => {
      const {input} = makeInput()
      const {term} = makeTerminal({stdin: input as any})
      const events: unknown[] = []
      term.onInput(event => events.push(event))
      term.startInput()

      const position = term.queryCursorPosition(1000)
      input.emit('data', Buffer.from(`a${CSI}7;`))
      input.emit('data', Buffer.from('9Rb'))

      await expect(position).resolves.toEqual({x: 8, y: 6})
      expect(events).toMatchObject([
        {type: 'key', key: 'a'},
        {type: 'key', key: 'b'},
      ])
      term.stopInput()
    })

    it('forwards malformed responses and continues waiting', async () => {
      const {input} = makeInput()
      const {term} = makeTerminal({stdin: input as any})
      const events: unknown[] = []
      term.onInput(event => events.push(event))
      term.startInput()

      const position = term.queryCursorPosition(1000)
      input.emit('data', Buffer.from(`${CSI}0;4R`))
      expect(events.length).toBeGreaterThan(0)
      input.emit('data', Buffer.from(`${CSI}3;5R`))

      await expect(position).resolves.toEqual({x: 4, y: 2})
      term.stopInput()
    })

    it('returns null when the cursor-position query times out', async () => {
      vi.useFakeTimers()
      const {input} = makeInput()
      const {term} = makeTerminal({stdin: input as any})
      term.startInput()

      const position = term.queryCursorPosition(25)
      await vi.advanceTimersByTimeAsync(25)

      await expect(position).resolves.toBeNull()
      term.stopInput()
      vi.useRealTimers()
    })

    it('does not emit a late cursor-position response as keyboard input', async () => {
      vi.useFakeTimers()
      const {input} = makeInput()
      const {term} = makeTerminal({stdin: input as any})
      const events: unknown[] = []
      term.onInput(event => events.push(event))
      term.startInput()

      const position = term.queryCursorPosition(25)
      await vi.advanceTimersByTimeAsync(25)
      await expect(position).resolves.toBeNull()
      input.emit('data', Buffer.from(`${CSI}3;5R`))

      expect(events).toEqual([])
      term.stopInput()
      vi.useRealTimers()
    })
  })

  describe('row reservation', () => {
    it('reserves from column zero and reports the post-scroll origin', async () => {
      const {input} = makeInput()
      const {term, getOutput} = makeTerminal({stdin: input as any})
      term.startInput()

      const origin = term.reserveRows(9, 1000)
      expect(getOutput()).toBe(`${CSI}6n`)

      input.emit('data', Buffer.from(`${CSI}23;1R`))
      await Promise.resolve()
      expect(getOutput()).toBe(
        `${CSI}6n\r${`${CSI}2K\n\r`.repeat(9)}${CSI}9A${CSI}6n`,
      )

      // Reserving near the bottom scrolls the initial row upward. The second
      // cursor query is the authoritative physical origin after that scroll.
      input.emit('data', Buffer.from(`${CSI}15;1R`))
      await expect(origin).resolves.toEqual({x: 0, y: 14})
      term.stopInput()
    })

    it('does not reserve rows when cancelled during the initial query', async () => {
      const {input} = makeInput()
      const {term, getOutput} = makeTerminal({stdin: input as any})
      term.startInput()
      let cancelled = false

      const origin = term.reserveRows(9, 1000, () => cancelled)
      cancelled = true
      input.emit('data', Buffer.from(`${CSI}23;1R`))

      await expect(origin).resolves.toBeNull()
      expect(getOutput()).toBe(`${CSI}6n`)
      term.stopInput()
    })

    it('starts on a fresh line when the cursor is not in column zero', async () => {
      const {input} = makeInput()
      const {term, getOutput} = makeTerminal({stdin: input as any})
      term.startInput()

      const origin = term.reserveRows(2, 1000)
      input.emit('data', Buffer.from(`${CSI}4;7R`))
      await Promise.resolve()
      expect(getOutput()).toBe(
        `${CSI}6n\r\n${`${CSI}2K\n\r`.repeat(2)}${CSI}2A${CSI}6n`,
      )

      input.emit('data', Buffer.from(`${CSI}5;1R`))
      await expect(origin).resolves.toEqual({x: 0, y: 4})
      term.stopInput()
    })

    it('clamps reserved rows to the physical terminal height', async () => {
      const {input} = makeInput()
      const {term, getOutput} = makeTerminal({stdin: input as any})
      term.startInput()

      const origin = term.reserveRows(30, 1000)
      input.emit('data', Buffer.from(`${CSI}1;1R`))
      await Promise.resolve()
      expect(getOutput()).toBe(
        `${CSI}6n\r${`${CSI}2K\n\r`.repeat(24)}${CSI}24A${CSI}6n`,
      )

      input.emit('data', Buffer.from(`${CSI}1;1R`))
      await expect(origin).resolves.toEqual({x: 0, y: 0})
      term.stopInput()
    })

    it('reserves keyboard-only rows when cursor reporting is unavailable', async () => {
      vi.useFakeTimers()
      const {input} = makeInput()
      const {term, getOutput} = makeTerminal({stdin: input as any})
      term.startInput()

      const origin = term.reserveRows(2, 25)
      await vi.advanceTimersByTimeAsync(25)

      await expect(origin).resolves.toBeNull()
      expect(getOutput()).toBe(
        `${CSI}6n\r\n${`${CSI}2K\n\r`.repeat(2)}${CSI}2A`,
      )
      term.stopInput()
      vi.useRealTimers()
    })

    it.each([0, -1, 1.5, Number.NaN])(
      'rejects invalid reserved row height %s',
      async height => {
        const {term, getOutput} = makeTerminal()
        await expect(term.reserveRows(height)).rejects.toThrow(RangeError)
        expect(getOutput()).toBe('')
      },
    )
  })

  describe('style() returns StyleBuilder', () => {
    it('creates independent StyleBuilder', () => {
      const {term} = makeTerminal()
      const s = term.style().bold().fg('red')
      expect(s.wrap('hi')).toBe(`${CSI}1m${CSI}31mhi${CSI}39m${CSI}22m`)
    })
  })

  describe('chaining', () => {
    it('all methods return this', () => {
      const {term} = makeTerminal()
      const result = term
        .bold()
        .fg('red')
        .bg('blue')
        .write('x')
        .writeln('y')
        .writeRaw('z')
        .moveTo(0, 0)
        .clear()
        .reset()
      expect(result).toBe(term)
    })
  })

  describe('buffered mode', () => {
    it('write does not output immediately', () => {
      const {term, getOutput} = makeTerminal({buffer: true})
      term.moveTo(0, 0).write('hello')
      expect(getOutput()).toBe('')
    })

    it('flush outputs buffered content', () => {
      const {term, getOutput} = makeTerminal({buffer: true})
      term.moveTo(0, 0).write('A')
      term.flush()
      const out = getOutput()
      expect(out).toContain('A')
      expect(out).toContain(`${CSI}?2026h`) // sync start
      expect(out).toContain(`${CSI}?2026l`) // sync end
    })

    it('second flush with no changes produces no output', () => {
      const {term, getOutput, clearOutput} = makeTerminal({buffer: true})
      term.moveTo(0, 0).write('A')
      term.flush()
      clearOutput()
      term.flush()
      expect(getOutput()).toBe('')
    })

    it('flush only writes changed cells', () => {
      const {term, getOutput, clearOutput} = makeTerminal({buffer: true})
      term.moveTo(0, 0).write('ABC')
      term.flush()
      clearOutput()

      term.moveTo(1, 0).write('X')
      term.flush()
      const out = getOutput()
      expect(out).toContain('X')
      expect(out).not.toContain('A')
      expect(out).not.toContain('C')
    })

    it('styled writes include style in flush output', () => {
      const {term, getOutput} = makeTerminal({buffer: true})
      term.moveTo(0, 0).bold().write('B')
      term.flush()
      const out = getOutput()
      expect(out).toContain(`${CSI}1m`)
      expect(out).toContain('B')
    })

    it('writeRaw bypasses buffer', () => {
      const {term, getOutput} = makeTerminal({buffer: true})
      term.writeRaw('raw')
      expect(getOutput()).toBe('raw')
    })

    it('clear resets buffer', () => {
      const {term, getOutput, clearOutput} = makeTerminal({buffer: true})
      term.moveTo(5, 5).write('X')
      term.flush()
      clearOutput()

      term.clear()
      term.flush()
      const out = getOutput()
      // The cell at (5,5) should be cleared to space
      expect(out).toContain(' ')
    })

    it('flush is no-op when buffer is disabled', () => {
      const {term, getOutput, clearOutput} = makeTerminal()
      term.write('hello')
      clearOutput()
      term.flush()
      expect(getOutput()).toBe('')
    })
  })
})
