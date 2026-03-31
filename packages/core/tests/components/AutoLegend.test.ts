import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {AutoLegend} from '../../lib/components/AutoLegend.js'
import {Input} from '../../lib/components/Input.js'
import {HotKey} from '../../lib/components/HotKey.js'
import {Stack} from '../../lib/components/Stack.js'
import {Box} from '../../lib/components/Box.js'

describe('AutoLegend', () => {
  it('shows legend items from the focused Input', () => {
    const legend = new AutoLegend()
    const input = new Input({value: 'hello', multiline: true})
    const view = Stack.down([input, legend])
    const t = testRender(view, {width: 120, height: 5})
    const text = t.terminal.textContent()
    // Input's legendItems includes Undo and Redo
    expect(text).toContain('Undo')
    expect(text).toContain('Redo')
  })

  it('shows multiline-specific items for multiline Input', () => {
    const legend = new AutoLegend()
    const input = new Input({value: 'hello', multiline: true})
    const view = Stack.down([input, legend])
    const t = testRender(view, {width: 120, height: 5})
    const text = t.terminal.textContent()
    expect(text).toContain('Indent')
    expect(text).toContain('Dedent')
  })

  it('does not show multiline items for single-line Input', () => {
    const legend = new AutoLegend()
    const input = new Input({value: 'hello'})
    const view = Stack.down([input, legend])
    const t = testRender(view, {width: 120, height: 5})
    const text = t.terminal.textContent()
    expect(text).not.toContain('Indent')
    expect(text).not.toContain('Dedent')
    // But still shows undo/redo
    expect(text).toContain('Undo')
  })

  it('shows labeled HotKey items', () => {
    const legend = new AutoLegend()
    const input = new Input({value: ''})
    const hotkey = new HotKey({hotKey: 'C-x', label: 'Quit'})
    const view = Stack.down([new Box({children: [input, hotkey]}), legend])
    const t = testRender(view, {width: 120, height: 5})
    const text = t.terminal.textContent()
    expect(text).toContain('Quit')
  })

  it('does not show HotKey items without labels', () => {
    const legend = new AutoLegend()
    const input = new Input({value: ''})
    const hotkey = new HotKey({hotKey: 'C-x'})
    const view = Stack.down([new Box({children: [input, hotkey]}), legend])
    const t = testRender(view, {width: 120, height: 5})
    const text = t.terminal.textContent()
    // Only Input legend items should appear, not the unlabeled hotkey
    expect(text).toContain('Undo')
    expect(text).not.toContain('C-x')
  })

  it('renders empty when nothing is focused', () => {
    const legend = new AutoLegend()
    const t = testRender(legend, {width: 60, height: 1})
    expect(t.terminal.textContent()).toBe('')
  })

  it('snapshot: multiline input legend', () => {
    const legend = new AutoLegend()
    const input = new Input({value: 'hello', multiline: true})
    const view = Stack.down([input, legend])
    const t = testRender(view, {width: 120, height: 4})
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('snapshot: single-line input legend', () => {
    const legend = new AutoLegend()
    const input = new Input({value: 'hello'})
    const view = Stack.down([input, legend])
    const t = testRender(view, {width: 120, height: 4})
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('snapshot: input with labeled HotKey', () => {
    const legend = new AutoLegend()
    const input = new Input({value: ''})
    const hotkey = new HotKey({hotKey: 'C-x', label: 'Quit'})
    const view = Stack.down([new Box({children: [input, hotkey]}), legend])
    const t = testRender(view, {width: 120, height: 4})
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('snapshot: focus changes legend content', () => {
    const legend = new AutoLegend()
    const input1 = new Input({value: 'a', multiline: true})
    const input2 = new Input({value: 'b'})
    const view = Stack.down([input1, input2, legend])
    const t = testRender(view, {width: 120, height: 5})
    const before = t.terminal.textContent()
    t.sendKey('tab')
    const after = t.terminal.textContent()
    expect(before).toMatchSnapshot()
    expect(after).toMatchSnapshot()
  })

  it('updates when focus changes', () => {
    const legend = new AutoLegend()
    const input1 = new Input({value: 'a', multiline: true})
    const input2 = new Input({value: 'b'})
    const view = Stack.down([input1, input2, legend])
    const t = testRender(view, {width: 120, height: 5})

    // input1 (multiline) has focus by default
    let text = t.terminal.textContent()
    expect(text).toContain('Indent')

    // Tab to input2 (single-line)
    t.sendKey('tab')
    text = t.terminal.textContent()
    expect(text).not.toContain('Indent')
    expect(text).toContain('Undo')
  })
})
