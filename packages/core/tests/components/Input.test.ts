import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Input} from '../../lib/components/Input.js'
import {Style} from '../../lib/Style.js'

describe('Input', () => {
  describe('rendering', () => {
    it('renders initial value', () => {
      const t = testRender(new Input({value: 'hello'}), {
        width: 20,
        height: 1,
      })
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders placeholder when empty', () => {
      const t = testRender(
        new Input({value: '', placeholder: 'Type here...'}),
        {width: 20, height: 1},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders empty input without crashing', () => {
      const t = testRender(new Input({value: ''}), {width: 20, height: 1})
      expect(t.terminal.textContent()).toBeDefined()
    })
  })

  describe('typing', () => {
    it('accepts single character', () => {
      let value = ''
      const input = new Input({
        value: '',
        onChange(v) {
          value = v
        },
      })
      const t = testRender(input, {width: 20, height: 1})
      t.sendKey('a')
      expect(value).toBe('a')
    })

    it('accepts multiple characters', () => {
      let value = ''
      const input = new Input({
        value: '',
        onChange(v) {
          value = v
        },
      })
      const t = testRender(input, {width: 20, height: 1})
      t.sendKey('a')
      t.sendKey('b')
      t.sendKey('c')
      expect(value).toBe('abc')
      expect(t.terminal.textContent()).toContain('abc')
    })

    it('appends to existing value', () => {
      let value = 'hi'
      const input = new Input({
        value: 'hi',
        onChange(v) {
          value = v
        },
      })
      const t = testRender(input, {width: 20, height: 1})
      t.sendKey('!')
      expect(value).toBe('hi!')
    })

    it('handles space key', () => {
      let value = 'a'
      const input = new Input({
        value: 'a',
        onChange(v) {
          value = v
        },
      })
      const t = testRender(input, {width: 20, height: 1})
      t.sendKey('space')
      expect(value).toBe('a ')
    })
  })

  describe('deletion', () => {
    it('backspace removes last character', () => {
      let value = 'hi'
      const input = new Input({
        value: 'hi',
        onChange(v) {
          value = v
        },
      })
      const t = testRender(input, {width: 20, height: 1})
      t.sendKey('backspace')
      expect(value).toBe('h')
    })

    it('backspace on empty does nothing', () => {
      let changed = false
      const input = new Input({
        value: '',
        onChange() {
          changed = true
        },
      })
      const t = testRender(input, {width: 20, height: 1})
      t.sendKey('backspace')
      expect(changed).toBe(false)
    })

    it('delete removes character at cursor', () => {
      let value = 'abc'
      const input = new Input({
        value: 'abc',
        onChange(v) {
          value = v
        },
      })
      const t = testRender(input, {width: 20, height: 1})
      t.sendKey('left')
      t.sendKey('left')
      t.sendKey('left')
      t.sendKey('delete')
      expect(value).toBe('bc')
    })

    it('delete word removes previous word', () => {
      let value = 'hello world'
      const input = new Input({
        value: 'hello world',
        onChange(v) {
          value = v
        },
      })
      const t = testRender(input, {width: 20, height: 1})
      t.sendKey('backspace', {alt: true})
      expect(value).toBe('hello ')
    })
  })

  describe('cursor movement', () => {
    it('left arrow moves cursor left', () => {
      let value = ''
      const input = new Input({
        value: 'ab',
        onChange(v) {
          value = v
        },
      })
      const t = testRender(input, {width: 20, height: 1})
      t.sendKey('left')
      t.sendKey('left')
      t.sendKey('x')
      expect(value).toBe('xab')
    })

    it('right arrow moves cursor right', () => {
      let value = ''
      const input = new Input({
        value: 'ab',
        onChange(v) {
          value = v
        },
      })
      const t = testRender(input, {width: 20, height: 1})
      t.sendKey('left')
      t.sendKey('left')
      t.sendKey('right')
      t.sendKey('x')
      expect(value).toBe('axb')
    })

    it('ctrl+a moves to start', () => {
      let value = ''
      const input = new Input({
        value: 'abc',
        onChange(v) {
          value = v
        },
      })
      const t = testRender(input, {width: 20, height: 1})
      t.sendKey('a', {ctrl: true})
      t.sendKey('x')
      expect(value).toBe('xabc')
    })

    it('ctrl+e moves to end', () => {
      let value = ''
      const input = new Input({
        value: 'abc',
        onChange(v) {
          value = v
        },
      })
      const t = testRender(input, {width: 20, height: 1})
      t.sendKey('a', {ctrl: true})
      t.sendKey('e', {ctrl: true})
      t.sendKey('x')
      expect(value).toBe('abcx')
    })
  })

  describe('cursor rendering', () => {
    it('cursor shown as underline at end of text', () => {
      const t = testRender(new Input({value: 'abc'}), {width: 10, height: 1})
      expect(t.terminal.getRow(0, 0, 3)).toBe('abc')
      expect(t.terminal.styleAt(3, 0).underline).toBe(true)
    })

    it('cursor moves visually with arrow keys', () => {
      const t = testRender(new Input({value: 'abc'}), {width: 10, height: 1})
      expect(t.terminal.styleAt(3, 0).underline).toBe(true)
      expect(t.terminal.styleAt(2, 0).underline).not.toBe(true)

      t.sendKey('left')
      expect(t.terminal.styleAt(2, 0).underline).toBe(true)
    })
  })

  describe('submit', () => {
    it('return fires onSubmit', () => {
      let submitted = ''
      const input = new Input({
        value: 'test',
        onSubmit(v) {
          submitted = v
        },
      })
      const t = testRender(input, {width: 20, height: 1})
      t.sendKey('return')
      expect(submitted).toBe('test')
    })

    it('return does not fire onChange', () => {
      let changed = false
      const input = new Input({
        value: 'test',
        onChange() {
          changed = true
        },
        onSubmit() {},
      })
      const t = testRender(input, {width: 20, height: 1})
      t.sendKey('return')
      expect(changed).toBe(false)
    })
  })

  describe('paste', () => {
    it('inserts pasted text at cursor', () => {
      const input = new Input({value: ''})
      const t = testRender(input, {width: 30, height: 1})
      t.sendPaste('hello world')
      expect(input.value).toBe('hello world')
    })

    it('inserts pasted text at cursor position mid-text', () => {
      const input = new Input({value: 'ac'})
      const t = testRender(input, {width: 30, height: 1})
      t.sendKey('home')
      t.sendKey('right')
      t.sendPaste('b')
      expect(input.value).toBe('abc')
    })

    it('replaces selection with pasted text', () => {
      const input = new Input({value: 'hello world'})
      const t = testRender(input, {width: 30, height: 1})
      t.sendKey('home')
      t.sendKey('end', {shift: true})
      t.sendPaste('goodbye')
      expect(input.value).toBe('goodbye')
    })

    it('fires onChange on paste', () => {
      let changed: string | undefined
      const input = new Input({
        value: '',
        onChange(value) {
          changed = value
        },
      })
      const t = testRender(input, {width: 30, height: 1})
      t.sendPaste('pasted')
      expect(changed).toBe('pasted')
    })

    it('strips newlines in single-line mode', () => {
      const input = new Input({value: ''})
      const t = testRender(input, {width: 30, height: 1})
      t.sendPaste('line1\nline2\nline3')
      expect(input.value).toBe('line1line2line3')
    })

    it('preserves newlines in multiline mode', () => {
      const input = new Input({value: '', multiline: true})
      const t = testRender(input, {width: 30, height: 5})
      t.sendPaste('line1\nline2')
      expect(input.value).toBe('line1\nline2')
    })

    it('does nothing for empty paste', () => {
      let changed = false
      const input = new Input({
        value: 'hello',
        onChange() {
          changed = true
        },
      })
      const t = testRender(input, {width: 30, height: 1})
      t.sendPaste('')
      expect(input.value).toBe('hello')
      expect(changed).toBe(false)
    })
  })

  describe('indentation', () => {
    it('preserves indentation on enter', () => {
      const input = new Input({value: '  hello', multiline: true})
      const t = testRender(input, {width: 30, height: 5})
      // cursor is at end of '  hello'
      t.sendKey('enter')
      expect(input.value).toBe('  hello\n  ')
    })

    it('preserves tab indentation on enter', () => {
      const input = new Input({value: '\thello', multiline: true})
      const t = testRender(input, {width: 30, height: 5})
      t.sendKey('enter')
      expect(input.value).toBe('\thello\n\t')
    })

    it('shift+enter inserts plain newline without indent', () => {
      const input = new Input({value: '  hello', multiline: true})
      const t = testRender(input, {width: 30, height: 5})
      t.sendKey('enter', {shift: true})
      expect(input.value).toBe('  hello\n')
    })

    it('alt+enter inserts plain newline without indent', () => {
      const input = new Input({value: '  hello', multiline: true})
      const t = testRender(input, {width: 30, height: 5})
      t.sendKey('enter', {alt: true})
      expect(input.value).toBe('  hello\n')
    })

    it('ctrl+] indents with spaces by default', () => {
      const input = new Input({value: 'hello', multiline: true})
      const t = testRender(input, {width: 30, height: 5})
      t.sendKey(']', {ctrl: true})
      expect(input.value).toBe('  hello')
    })

    it('ctrl+] indents with tab when tabs are used', () => {
      const input = new Input({value: '\tline1\nline2', multiline: true})
      const t = testRender(input, {width: 30, height: 5})
      // move to line 2
      t.sendKey('down')
      t.sendKey(']', {ctrl: true})
      expect(input.value).toBe('\tline1\n\tline2')
    })

    it('ctrl+[ removes two-space indent', () => {
      const input = new Input({value: '  hello', multiline: true})
      const t = testRender(input, {width: 30, height: 5})
      t.sendKey('[', {ctrl: true})
      expect(input.value).toBe('hello')
    })

    it('ctrl+[ removes tab indent', () => {
      const input = new Input({value: '\thello', multiline: true})
      const t = testRender(input, {width: 30, height: 5})
      t.sendKey('[', {ctrl: true})
      expect(input.value).toBe('hello')
    })

    it('ctrl+[ does nothing without indentation', () => {
      const input = new Input({value: 'hello', multiline: true})
      const t = testRender(input, {width: 30, height: 5})
      t.sendKey('[', {ctrl: true})
      expect(input.value).toBe('hello')
    })

    it('alt+tab inserts a literal tab', () => {
      const input = new Input({value: 'hello', multiline: true})
      const t = testRender(input, {width: 30, height: 5})
      t.sendKey('tab', {alt: true})
      expect(input.value).toBe('hello\t')
    })
  })

  describe('cursor movement with tabs', () => {
    it('down from tab moves cursor to correct column', () => {
      const input = new Input({
        value: '\ttest\none\ntwo',
        multiline: true,
      })
      const t = testRender(input, {width: 30, height: 5})
      // Move cursor to start
      t.sendKey('a', {ctrl: true})
      // Cursor is at position 0 (the tab char)
      // Press down: should move to 'o' in 'one' (column 0)
      t.sendKey('down')
      t.sendKey('!')
      expect(input.value).toBe('\ttest\n!one\ntwo')
    })

    it('down then down moves to correct position on third line', () => {
      const input = new Input({
        value: '\ttest\none\ntwo',
        multiline: true,
      })
      const t = testRender(input, {width: 30, height: 5})
      t.sendKey('a', {ctrl: true})
      t.sendKey('down')
      t.sendKey('down')
      t.sendKey('!')
      expect(input.value).toBe('\ttest\none\n!two')
    })

    it('up from line below tab moves to correct column', () => {
      const input = new Input({
        value: '\ttest\none\ntwo',
        multiline: true,
      })
      const t = testRender(input, {width: 30, height: 5})
      // Move to start of 'one' line
      t.sendKey('a', {ctrl: true})
      t.sendKey('down')
      // Now press up: should go back to tab char (column 0)
      t.sendKey('up')
      t.sendKey('!')
      expect(input.value).toBe('!\ttest\none\ntwo')
    })
  })

  describe('undo/redo', () => {
    it('ctrl+z undoes the last edit', () => {
      const input = new Input({value: 'hello', multiline: true})
      const t = testRender(input, {width: 30, height: 3})
      t.sendKey('!')
      expect(input.value).toBe('hello!')
      t.sendKey('z', {ctrl: true})
      expect(input.value).toBe('hello')
    })

    it('ctrl+- undoes the last edit', () => {
      const input = new Input({value: 'hello', multiline: true})
      const t = testRender(input, {width: 30, height: 3})
      t.sendKey('!')
      expect(input.value).toBe('hello!')
      t.sendKey('-', {ctrl: true})
      expect(input.value).toBe('hello')
    })

    it('ctrl+shift+z redoes an undone edit', () => {
      const input = new Input({value: 'hello', multiline: true})
      const t = testRender(input, {width: 30, height: 3})
      t.sendKey('!')
      expect(input.value).toBe('hello!')
      t.sendKey('z', {ctrl: true})
      expect(input.value).toBe('hello')
      t.sendKey('z', {ctrl: true, shift: true})
      expect(input.value).toBe('hello!')
    })

    it('ctrl+shift+- redoes an undone edit', () => {
      const input = new Input({value: 'hello', multiline: true})
      const t = testRender(input, {width: 30, height: 3})
      t.sendKey('!')
      expect(input.value).toBe('hello!')
      t.sendKey('-', {ctrl: true})
      expect(input.value).toBe('hello')
      t.sendKey('-', {ctrl: true, shift: true})
      expect(input.value).toBe('hello!')
    })

    it('undo restores cursor position', () => {
      const input = new Input({value: 'abc', multiline: true})
      const t = testRender(input, {width: 30, height: 3})
      // cursor at end (pos 3), type '!'
      t.sendKey('!')
      expect(input.value).toBe('abc!')
      t.sendKey('z', {ctrl: true})
      expect(input.value).toBe('abc')
      // typing again should insert at restored cursor position (end)
      t.sendKey('?')
      expect(input.value).toBe('abc?')
    })

    it('consecutive inserts are grouped', () => {
      const input = new Input({value: '', multiline: true})
      const t = testRender(input, {width: 30, height: 3})
      t.sendKey('a')
      t.sendKey('b')
      t.sendKey('c')
      expect(input.value).toBe('abc')
      // Single undo should revert all three characters
      t.sendKey('z', {ctrl: true})
      expect(input.value).toBe('')
    })

    it('consecutive inserts at different positions are not grouped', () => {
      const input = new Input({value: 'ac', multiline: true})
      const t = testRender(input, {width: 30, height: 3})
      // Move cursor to after 'a'
      t.sendKey('a', {ctrl: true})
      t.sendKey('right')
      t.sendKey('b')
      expect(input.value).toBe('abc')
      // Move to end and type
      t.sendKey('e', {ctrl: true})
      t.sendKey('!')
      expect(input.value).toBe('abc!')
      // First undo reverts '!'
      t.sendKey('z', {ctrl: true})
      expect(input.value).toBe('abc')
      // Second undo reverts 'b'
      t.sendKey('z', {ctrl: true})
      expect(input.value).toBe('ac')
    })

    it('undo reverts backspace', () => {
      const input = new Input({value: 'hello', multiline: true})
      const t = testRender(input, {width: 30, height: 3})
      t.sendKey('backspace')
      expect(input.value).toBe('hell')
      t.sendKey('z', {ctrl: true})
      expect(input.value).toBe('hello')
    })

    it('undo reverts paste', () => {
      const input = new Input({value: 'hello', multiline: true})
      const t = testRender(input, {width: 30, height: 3})
      t.sendPaste(' world')
      expect(input.value).toBe('hello world')
      t.sendKey('z', {ctrl: true})
      expect(input.value).toBe('hello')
    })

    it('new edit after undo clears redo stack', () => {
      const input = new Input({value: 'hello', multiline: true})
      const t = testRender(input, {width: 30, height: 3})
      t.sendKey('!')
      expect(input.value).toBe('hello!')
      t.sendKey('z', {ctrl: true})
      expect(input.value).toBe('hello')
      // New edit should clear redo
      t.sendKey('?')
      expect(input.value).toBe('hello?')
      // Redo should do nothing now
      t.sendKey('z', {ctrl: true, shift: true})
      expect(input.value).toBe('hello?')
    })

    it('undo does nothing when stack is empty', () => {
      const input = new Input({value: 'hello', multiline: true})
      const t = testRender(input, {width: 30, height: 3})
      t.sendKey('z', {ctrl: true})
      expect(input.value).toBe('hello')
    })

    it('redo does nothing when stack is empty', () => {
      const input = new Input({value: 'hello', multiline: true})
      const t = testRender(input, {width: 30, height: 3})
      t.sendKey('z', {ctrl: true, shift: true})
      expect(input.value).toBe('hello')
    })

    it('multiple undos walk back through history', () => {
      const input = new Input({value: '', multiline: true})
      const t = testRender(input, {width: 30, height: 3})
      t.sendKey('a')
      // move cursor to break grouping
      t.sendKey('left')
      t.sendKey('right')
      t.sendKey('b')
      expect(input.value).toBe('ab')
      t.sendKey('z', {ctrl: true})
      expect(input.value).toBe('a')
      t.sendKey('z', {ctrl: true})
      expect(input.value).toBe('')
    })

    it('undo reverts indent', () => {
      const input = new Input({value: 'hello', multiline: true})
      const t = testRender(input, {width: 30, height: 3})
      t.sendKey(']', {ctrl: true})
      expect(input.value).toBe('  hello')
      t.sendKey('z', {ctrl: true})
      expect(input.value).toBe('hello')
    })

    it('undo reverts enter with indent', () => {
      const input = new Input({value: '  hello', multiline: true})
      const t = testRender(input, {width: 30, height: 3})
      t.sendKey('enter')
      expect(input.value).toBe('  hello\n  ')
      t.sendKey('z', {ctrl: true})
      expect(input.value).toBe('  hello')
    })
  })

  describe('focus', () => {
    it('plain tab changes focus, not inserted', () => {
      const input = new Input({value: 'hello'})
      const t = testRender(input, {width: 30, height: 1})
      t.sendKey('tab')
      expect(input.value).toBe('hello')
    })

    it('ctrl+tab does not change focus and is sent to input', () => {
      const input = new Input({value: 'hello', multiline: true})
      const t = testRender(input, {width: 30, height: 3})
      // ctrl+tab goes to the focused input (not handled as focus change)
      // Input doesn't handle ctrl+tab, so value should be unchanged
      t.sendKey('tab', {ctrl: true})
      expect(input.value).toBe('hello')
    })
  })

  describe('format', () => {
    // A simple formatter that colors keywords red
    function colorKeywords(text: string): string {
      return text.replace(
        /\b(const|let|var|function|return)\b/g,
        '\x1b[31m$1\x1b[0m',
      )
    }

    it('applies format styles to rendered text', () => {
      const input = new Input({
        value: 'const x = 1',
        format: colorKeywords,
      })
      const t = testRender(input, {width: 20, height: 1})
      // 'const' should be red (foreground color)
      const constStyle = t.terminal.styleAt(0, 0)
      expect(constStyle.foreground).toBe('red')
      // 'x' should not have red foreground
      const xStyle = t.terminal.styleAt(6, 0)
      expect(xStyle.foreground).not.toBe('red')
    })

    it('renders formatted text correctly', () => {
      const input = new Input({
        value: 'const x = 1',
        format: colorKeywords,
      })
      const t = testRender(input, {width: 20, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('applies format styles to multiline text', () => {
      const input = new Input({
        value: 'const x = 1\nlet y = 2',
        multiline: true,
        format: colorKeywords,
      })
      const t = testRender(input, {width: 20, height: 3})
      // 'const' on line 0 should be red
      expect(t.terminal.styleAt(0, 0).foreground).toBe('red')
      // 'let' on line 1 should be red
      expect(t.terminal.styleAt(0, 1).foreground).toBe('red')
      // 'x' on line 0 should not be red
      expect(t.terminal.styleAt(6, 0).foreground).not.toBe('red')
    })

    it('works with empty value', () => {
      const input = new Input({
        value: '',
        format: colorKeywords,
        placeholder: 'type here',
      })
      const t = testRender(input, {width: 20, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('preserves cursor styling with format', () => {
      const input = new Input({
        value: 'const',
        format: colorKeywords,
      })
      const t = testRender(input, {width: 20, height: 1})
      // cursor is at position 5 (after 'const'), should have underline
      const cursorStyle = t.terminal.styleAt(5, 0)
      expect(cursorStyle.underline).toBe(true)
    })

    it('updates format when value changes', () => {
      const input = new Input({
        value: 'hello',
        format: colorKeywords,
      })
      const t = testRender(input, {width: 20, height: 1})
      // 'hello' has no keywords, should not be red
      expect(t.terminal.styleAt(0, 0).foreground).not.toBe('red')

      input.value = 'const x'
      t.render()
      // now 'const' should be red
      expect(t.terminal.styleAt(0, 0).foreground).toBe('red')
    })
  })
})
