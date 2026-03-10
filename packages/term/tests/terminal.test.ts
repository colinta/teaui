import {describe, it, expect} from 'vitest'
import {Terminal} from '../src/terminal.js'
import {CSI, ESC} from '../src/ansi.js'

function makeTerminal(options: {buffer?: boolean} = {}) {
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
