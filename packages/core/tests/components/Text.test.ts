import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Text} from '../../lib/components/Text.js'
import {Style} from '../../lib/Style.js'

describe('Text', () => {
  it('renders text content', () => {
    const t = testRender(new Text({text: 'Hello, world!'}), {
      width: 20,
      height: 1,
    })
    expect(t.terminal.textContent()).toBe('Hello, world!')
  })

  it('can query individual characters', () => {
    const t = testRender(new Text({text: 'ABC'}), {width: 10, height: 1})
    expect(t.terminal.charAt(0, 0)).toBe('A')
    expect(t.terminal.charAt(1, 0)).toBe('B')
    expect(t.terminal.charAt(2, 0)).toBe('C')
  })

  it('can read substrings', () => {
    const t = testRender(new Text({text: 'Hello World'}), {
      width: 20,
      height: 1,
    })
    expect(t.terminal.textAt(0, 0, 5)).toBe('Hello')
    expect(t.terminal.textAt(6, 0, 5)).toBe('World')
  })

  it('renders bold text', () => {
    const t = testRender(new Text({text: 'Bold', style: Style.bold}), {
      width: 10,
      height: 1,
    })
    expect(t.terminal.charAt(0, 0)).toBe('B')
    expect(t.terminal.styleAt(0, 0).bold).toBe(true)
  })

  it('renders italic text', () => {
    const t = testRender(
      new Text({text: 'Italic', style: new Style({italic: true})}),
      {width: 10, height: 1},
    )
    expect(t.terminal.styleOf('Italic')!.italic).toBe(true)
  })

  it('renders underlined text', () => {
    const t = testRender(new Text({text: 'Under', style: Style.underlined}), {
      width: 10,
      height: 1,
    })
    expect(t.terminal.styleOf('Under')!.underline).toBe(true)
  })

  it('wraps long text when wrap is enabled', () => {
    const t = testRender(new Text({text: 'Hello World', wrap: true}), {
      width: 6,
      height: 3,
    })
    expect(t.terminal.textAtRow(0)).toBe('Hello')
    expect(t.terminal.textAtRow(1)).toBe('World')
  })

  it('truncates long text when wrap is disabled', () => {
    const t = testRender(new Text({text: 'Hello World'}), {width: 5, height: 1})
    // Only first 5 chars visible
    expect(t.terminal.getRow(0, 0, 5)).toBe('Hello')
  })

  it('renders multiline text from lines array', () => {
    const t = testRender(new Text({lines: ['Line 1', 'Line 2', 'Line 3']}), {
      width: 10,
      height: 3,
    })
    expect(t.terminal.textAtRow(0)).toBe('Line 1')
    expect(t.terminal.textAtRow(1)).toBe('Line 2')
    expect(t.terminal.textAtRow(2)).toBe('Line 3')
  })

  it('renders empty text without crashing', () => {
    const t = testRender(new Text({text: ''}), {width: 10, height: 1})
    expect(t.terminal.textContent()).toBe('')
  })
})
