import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Input} from '../../lib/components/Input.js'
import {Size} from '../../lib/geometry.js'

describe('Input secret', () => {
  it('masks every character but keeps the real value', () => {
    const input = new Input({value: 'hunter 2', secret: true})
    const t = testRender(input, {width: 20, height: 1})
    expect(t.terminal.textContent()).toMatchSnapshot()
    expect(t.terminal.textContent()).not.toContain('hunter')
    expect(input.value).toBe('hunter 2')
  })

  it('masks wide characters and tabs as single cells', () => {
    const input = new Input({value: '日本\tx', secret: true})
    expect(input.naturalSize(new Size(20, 1))).toEqual(new Size(5, 1))
    const t = testRender(input, {width: 20, height: 1})
    expect(t.terminal.textContent()).toBe('••••')
  })

  it('shows the placeholder unmasked when empty', () => {
    const t = testRender(
      new Input({value: '', placeholder: 'Password', secret: true}),
      {width: 20, height: 1},
    )
    expect(t.terminal.textContent()).toBe('Password')
  })

  it('masks typed characters and reports the real value', () => {
    let value = ''
    const input = new Input({
      secret: true,
      onChange(v) {
        value = v
      },
    })
    const t = testRender(input, {width: 20, height: 1})
    t.sendKey('a')
    t.sendKey('b')
    t.sendKey('c')
    expect(value).toBe('abc')
    expect(t.terminal.textContent()).toBe('•••')
  })

  it('is always single-line', () => {
    const input = new Input({value: 'a\nb', secret: true, multiline: true})
    expect(input.multiline).toBe(false)
    expect(input.value).toBe('a b')
    const t = testRender(input, {width: 20, height: 3})
    expect(t.terminal.textContent()).toBe('•••')
    input.multiline = true
    expect(input.multiline).toBe(false)
  })

  it('does not wrap', () => {
    const input = new Input({value: 'abcdefghij', secret: true, wrap: true})
    expect(input.wrap).toBe(false)
  })

  it('ignores format so styles cannot reveal the text', () => {
    const t = testRender(
      new Input({
        value: 'ab',
        secret: true,
        format: text => `\x1b[31m${text}\x1b[0m`,
      }),
      {width: 10, height: 1},
    )
    expect(t.terminal.styleOf('•')?.foreground).not.toBe('red')
  })

  it('treats the whole value as one word for alt+backspace', () => {
    let value = 'hello world'
    const input = new Input({
      value,
      secret: true,
      onChange(v) {
        value = v
      },
    })
    const t = testRender(input, {width: 20, height: 1})
    t.sendKey('backspace', {alt: true})
    expect(value).toBe('')
  })

  it('jumps over spaces with alt+arrows', () => {
    let value = 'hello world'
    const input = new Input({
      value,
      secret: true,
      onChange(v) {
        value = v
      },
    })
    const t = testRender(input, {width: 20, height: 1})
    t.sendKey('left', {alt: true})
    t.sendKey('X')
    expect(value).toBe('Xhello world')
  })

  it('can be toggled with the secret setter', () => {
    const input = new Input({value: 'abc'})
    const t = testRender(input, {width: 10, height: 1})
    expect(t.terminal.textContent()).toBe('abc')
    input.secret = true
    t.render()
    expect(t.terminal.textContent()).toBe('•••')
    input.secret = false
    t.render()
    expect(t.terminal.textContent()).toBe('abc')
  })
})
