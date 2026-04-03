import {describe, it, expect} from 'vitest'
import {testRender} from '../lib/TestScreen.js'
import {Box} from '../lib/components/Box.js'
import {Text} from '../lib/components/Text.js'
import {Stack} from '../lib/components/Stack.js'
import {Input} from '../lib/components/Input.js'
import {Style} from '../lib/Style.js'

describe('TestTerminal query API', () => {
  describe('getRow', () => {
    it('returns full row without trimming', () => {
      const t = testRender(new Text({text: 'Hi'}), {width: 6, height: 1})
      expect(t.terminal.getRow(0)).toBe('Hi    ')
    })

    it('supports slicing', () => {
      const t = testRender(new Text({text: 'Hello World'}), {
        width: 20,
        height: 1,
      })
      expect(t.terminal.getRow(0, 0, 5)).toBe('Hello')
      expect(t.terminal.getRow(0, 6, 11)).toBe('World')
    })
  })

  describe('textRect', () => {
    it('extracts a rectangular region', () => {
      const box = new Box({
        border: 'single',
        children: [new Text({text: 'Hi'})],
      })
      const t = testRender(box, {width: 6, height: 3})
      expect(t.terminal.textRect(0, 0, 6, 3)).toBe(
        '┌────┐\n' + '│Hi  │\n' + '└────┘',
      )
    })

    it('can extract a sub-region', () => {
      const box = new Box({
        border: 'single',
        children: [new Text({text: 'Hi'})],
      })
      const t = testRender(box, {width: 6, height: 3})
      // Just the interior
      expect(t.terminal.textRect(1, 1, 4, 1)).toBe('Hi  ')
    })
  })

  describe('Box borders', () => {
    it('renders single border', () => {
      const box = new Box({
        border: 'single',
        children: [new Text({text: ''})],
      })
      const t = testRender(box, {width: 5, height: 3})
      expect(t.terminal.textRect(0, 0, 5, 3)).toBe(
        '┌───┐\n' + '│   │\n' + '└───┘',
      )
    })

    it('renders bold border', () => {
      const box = new Box({
        border: 'bold',
        children: [new Text({text: ''})],
      })
      const t = testRender(box, {width: 5, height: 3})
      expect(t.terminal.textRect(0, 0, 5, 3)).toBe(
        '┏━━━┓\n' + '┃   ┃\n' + '┗━━━┛',
      )
    })

    it('renders double border', () => {
      const box = new Box({
        border: 'double',
        children: [new Text({text: ''})],
      })
      const t = testRender(box, {width: 5, height: 3})
      expect(t.terminal.textRect(0, 0, 5, 3)).toBe(
        '╔═══╗\n' + '║   ║\n' + '╚═══╝',
      )
    })

    it('renders rounded border', () => {
      const box = new Box({
        border: 'rounded',
        children: [new Text({text: ''})],
      })
      const t = testRender(box, {width: 5, height: 3})
      expect(t.terminal.textRect(0, 0, 5, 3)).toBe(
        '╭───╮\n' + '│   │\n' + '╰───╯',
      )
    })

    it('renders border with content', () => {
      const box = new Box({
        border: 'single',
        children: [new Text({text: 'ABC'})],
      })
      const t = testRender(box, {width: 7, height: 3})
      expect(t.terminal.textRect(0, 0, 7, 3)).toBe(
        '┌─────┐\n' + '│ABC  │\n' + '└─────┘',
      )
    })
  })

  describe('stylesMatch', () => {
    it('checks a range of cells for a style property', () => {
      const stack = new Stack({
        children: [
          new Text({text: 'Bold', style: Style.bold}),
          new Text({text: 'Plain'}),
        ],
        direction: 'down',
      })
      const t = testRender(stack, {width: 10, height: 2})
      expect(t.terminal.stylesMatch(0, 0, 4, s => s.bold === true)).toBe(true)
      // Second row should not be bold
      expect(t.terminal.stylesMatch(0, 1, 5, s => !s.bold)).toBe(true)
    })

    it('checks a 2D region', () => {
      const stack = new Stack({
        children: [
          new Text({text: 'Bold line', style: Style.bold}),
          new Text({text: 'Another bold', style: Style.bold}),
        ],
        direction: 'down',
      })
      const t = testRender(stack, {width: 15, height: 2})
      // Both rows should be bold
      expect(t.terminal.stylesMatch(0, 0, 9, s => s.bold === true, 2)).toBe(
        true,
      )
    })
  })

  describe('contentEquals', () => {
    it('matches expected content', () => {
      const t = testRender(new Text({text: 'Hello'}), {width: 10, height: 1})
      expect(t.terminal.contentEquals('Hello')).toBe(true)
    })

    it('matches multi-line content', () => {
      const box = new Box({
        border: 'single',
        children: [new Text({text: ''})],
      })
      const t = testRender(box, {width: 5, height: 3})
      expect(t.terminal.contentEquals('┌───┐\n' + '│   │\n' + '└───┘')).toBe(
        true,
      )
    })
  })

  describe('Input cursor rendering', () => {
    it('shows cursor at end of text', () => {
      const t = testRender(new Input({value: 'abc'}), {width: 10, height: 1})
      // Characters 0-2 should be 'a', 'b', 'c'
      expect(t.terminal.getRow(0, 0, 3)).toBe('abc')
      // Cursor at position 3 should be underlined
      expect(t.terminal.styleAt(3, 0).underline).toBe(true)
      // Characters before cursor should not be underlined
      expect(t.terminal.stylesMatch(0, 0, 3, s => !s.underline)).toBe(true)
    })

    it('cursor moves with arrow keys', () => {
      const t = testRender(new Input({value: 'abc'}), {width: 10, height: 1})
      // Cursor starts at end (position 3)
      expect(t.terminal.styleAt(3, 0).underline).toBe(true)
      // 'c' at position 2 should NOT be underlined (cursor is past it)
      expect(t.terminal.styleAt(2, 0).underline).not.toBe(true)

      t.sendKey('left')
      // Now cursor should be at position 2 ('c')
      expect(t.terminal.styleAt(2, 0).underline).toBe(true)
    })
  })

  describe('Stack layout', () => {
    it('renders children vertically', () => {
      const stack = new Stack({
        children: [
          new Text({text: 'Line 1'}),
          new Text({text: 'Line 2'}),
          new Text({text: 'Line 3'}),
        ],
        direction: 'down',
      })
      const t = testRender(stack, {width: 10, height: 3})
      expect(t.terminal.textAtRow(0)).toBe('Line 1')
      expect(t.terminal.textAtRow(1)).toBe('Line 2')
      expect(t.terminal.textAtRow(2)).toBe('Line 3')
    })
  })
})
