import {describe, it, expect} from 'vitest'
import {testRender} from '../lib/TestScreen.js'
import {Stack} from '../lib/components/Stack.js'
import {Text} from '../lib/components/Text.js'
import {Size} from '../lib/geometry.js'

describe('View padding', () => {
  it('natural dimensions exclude the padding from the content size', () => {
    const text = new Text({text: 'natural'})
    const stack = Stack.down({
      padding: 1,
      width: 'natural',
      height: 'natural',
      children: [text],
    })
    const t = testRender(Stack.right([stack]), {width: 30, height: 6})
    // (the padding used to be counted twice: measured, and in the content)
    expect(stack.contentSize).toEqual(new Size(7, 1))
    expect(text.contentSize).toEqual(new Size(7, 1))
    // offset by the padding once
    expect(t.terminal.textContent()).toBe('\n natural')
  })

  it('wrapping text is measured with the padded width', () => {
    const text = new Text({text: 'aaa bbb ccc', wrap: true})
    const stack = Stack.down({
      padding: 1,
      height: 'natural',
      children: [text],
    })
    const t = testRender(Stack.down([stack]), {width: 9, height: 6})
    expect(stack.contentSize).toEqual(new Size(7, 2))
    expect(t.terminal.textContent()).toBe('\n aaa bbb\n ccc')
  })

  it('fills the available space, minus the padding', () => {
    const text = new Text({text: 'x'})
    const stack = Stack.down({
      padding: {top: 1, right: 2, bottom: 3, left: 4},
      children: [text],
    })
    const t = testRender(stack, {width: 20, height: 10})
    expect(stack.contentSize).toEqual(new Size(14, 6))
    expect(text.contentSize.width).toBe(14)
    expect(t.terminal.textContent()).toBe('\n    x')
  })

  it('a fixed width includes the padding', () => {
    const stack = Stack.down({
      padding: 1,
      width: 10,
      height: 'natural',
      children: [new Text({text: 'x'})],
    })
    testRender(Stack.right([stack]), {width: 30, height: 6})
    expect(stack.contentSize).toEqual(new Size(8, 1))
  })
})
