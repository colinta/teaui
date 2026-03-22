import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Input} from '../../lib/components/Input.js'

describe('Input', () => {
  describe('rendering', () => {
    it('renders initial value', () => {
      const t = testRender(new Input({value: 'hello'}), {
        width: 20,
        height: 1,
      })
      expect(t.terminal.textContent()).toContain('hello')
    })

    it('renders placeholder when empty', () => {
      const t = testRender(
        new Input({value: '', placeholder: 'Type here...'}),
        {width: 20, height: 1},
      )
      expect(t.terminal.textContent()).toContain('Type here...')
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
      // Move cursor to start, then delete
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
      t.sendKey('backspace', {meta: true})
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
      // Move cursor to position 1 (between 'a' and 'c')
      t.sendKey('home')
      t.sendKey('right')
      t.sendPaste('b')
      expect(input.value).toBe('abc')
    })

    it('replaces selection with pasted text', () => {
      const input = new Input({value: 'hello world'})
      const t = testRender(input, {width: 30, height: 1})
      // Select all with Ctrl+A then paste
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
})
