import {describe, it, expect} from 'vitest'
import {Size} from '../../lib/geometry.js'
import {testRender} from '../../lib/TestScreen.js'
import {Stack} from '../../lib/components/Stack.js'
import {Text} from '../../lib/components/Text.js'
import {Input} from '../../lib/components/Input.js'

describe('Stack', () => {
  describe('vertical layout (down)', () => {
    it('renders children top to bottom', () => {
      const t = testRender(
        new Stack({
          children: [
            new Text({text: 'Line 1'}),
            new Text({text: 'Line 2'}),
            new Text({text: 'Line 3'}),
          ],
          direction: 'down',
        }),
        {width: 10, height: 3},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('invalidates its natural size when removing a child', () => {
      const first = new Text({text: 'First'})
      const second = new Text({text: 'Second'})
      const third = new Text({text: 'Third'})
      const stack = Stack.down([first, second, third])
      const available = new Size(20, 10)

      expect(stack.naturalSize(available).height).toBe(3)
      stack.removeChild(second)
      expect(stack.naturalSize(available).height).toBe(2)

      stack.removeAllChildren()
      expect(stack.children).toEqual([])
      expect(stack.naturalSize(available).height).toBe(0)
    })

    it('renders single child', () => {
      const t = testRender(
        new Stack({
          children: [new Text({text: 'Only'})],
          direction: 'down',
        }),
        {width: 10, height: 1},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('horizontal layout (right)', () => {
    it('renders children left to right', () => {
      const t = testRender(
        new Stack({
          children: [
            new Text({text: 'A'}),
            new Text({text: 'B'}),
            new Text({text: 'C'}),
          ],
          direction: 'right',
        }),
        {width: 9, height: 1},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('focus cycling', () => {
    it('tab moves focus between children', () => {
      let val1 = ''
      let val2 = ''
      const input1 = new Input({
        value: 'first',
        onChange(v) {
          val1 = v
        },
      })
      const input2 = new Input({
        value: 'second',
        onChange(v) {
          val2 = v
        },
      })
      const t = testRender(
        new Stack({children: [input1, input2], direction: 'down'}),
        {width: 20, height: 3},
      )

      // First input has focus
      t.sendKey('!')
      expect(val1).toBe('first!')

      // Tab to second input
      t.sendKey('tab')
      t.sendKey('!')
      expect(val2).toBe('second!')
    })

    it('shift+tab moves focus backwards', () => {
      let val1 = ''
      const input1 = new Input({
        value: 'first',
        onChange(v) {
          val1 = v
        },
      })
      const input2 = new Input({
        value: 'second',
        onChange(_v) {},
      })
      const t = testRender(
        new Stack({children: [input1, input2], direction: 'down'}),
        {width: 20, height: 3},
      )

      // Tab to second, then shift+tab back to first
      t.sendKey('tab')
      t.sendKey('tab', {shift: true})
      t.sendKey('!')
      expect(val1).toBe('first!')
    })
  })
})
