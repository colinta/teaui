import {describe, it, expect, vi} from 'vitest'
import * as unicode from '@teaui/term'
import {testRender} from '../../lib/TestScreen.js'
import {Box} from '../../lib/components/Box.js'
import {Input, type Props} from '../../lib/components/Input.js'

function click(t: ReturnType<typeof testRender>, x: number, y = 0) {
  t.sendMouse('mouse.button.down', {x, y})
  t.sendMouse('mouse.button.up', {x, y})
}

const DBL_CLICK = 300

describe('Input mouse selection', () => {
  describe('single clicks and hit regions', () => {
    it.each([{value: 'hello'}, {placeholder: 'Type here'}])(
      'keeps focused text and background styling stable while pressed: %j',
      props => {
        const t = testRender(new Input({...props, purpose: 'primary'}), {
          width: 20,
          height: 1,
        })
        const styles = () =>
          Array.from({length: 20}, (_, x) => t.terminal.styleAt(x, 0))
        const before = styles()
        t.sendMouse('mouse.button.down', {x: 1, y: 0})
        expect(styles()).toEqual(before)
        t.sendMouse('mouse.button.up', {x: 1, y: 0})
        expect(styles()).toEqual(before)
      },
    )

    it('waits for release and the double-click interval before moving', () => {
      const onChange = vi.fn()
      const input = new Input({value: 'hello', onChange})
      const t = testRender(input, {width: 10, height: 1})
      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      t.tick(DBL_CLICK * 2)
      expect(input.minSelected()).toBe(5)
      t.sendMouse('mouse.button.up', {x: 1, y: 0})
      t.tick(DBL_CLICK - 1)
      expect(input.minSelected()).toBe(5)
      t.tick(1)
      expect(input.minSelected()).toBe(1)
      expect(t.terminal.styleAt(1, 0).underline).toBe(true)
      expect(onChange).not.toHaveBeenCalled()
      t.sendKey('!')
      expect(input.value).toBe('h!ello')
    })

    const cases: {
      name: string
      props: Props
      width: number
      height: number
      x: number
      y: number
      offset: number
    }[] = [
      {
        name: 'multiline',
        props: {value: 'first\nsecond', multiline: true},
        width: 20,
        height: 3,
        x: 4,
        y: 1,
        offset: 10,
      },
      {
        name: 'past a short line',
        props: {value: 'one\ntwo', multiline: true},
        width: 20,
        height: 3,
        x: 15,
        y: 0,
        offset: 3,
      },
      {
        name: 'empty line',
        props: {value: 'one\n\ntwo', multiline: true},
        width: 20,
        height: 3,
        x: 5,
        y: 1,
        offset: 4,
      },
      {
        name: 'trailing newline',
        props: {value: 'one\n', multiline: true},
        width: 20,
        height: 3,
        x: 5,
        y: 1,
        offset: 4,
      },
      {
        name: 'horizontally scrolled',
        props: {value: '0123456789abcdefghij'},
        width: 10,
        height: 1,
        x: 2,
        y: 0,
        offset: 13,
      },
      {
        name: 'initial ellipsis',
        props: {value: '0123456789abcdefghij'},
        width: 10,
        height: 1,
        x: 0,
        y: 0,
        offset: 11,
      },
      {
        name: 'vertically scrolled',
        props: {value: 'zero\none\ntwo\nthree', multiline: true},
        width: 20,
        height: 2,
        x: 1,
        y: 0,
        offset: 10,
      },
      {
        name: 'scrolled in both directions',
        props: {
          value:
            '0123456789abcdefghij\nABCDEFGHIJKLMNOPQRST\nuvwxyz0123456789abcd',
          multiline: true,
        },
        width: 10,
        height: 2,
        x: 3,
        y: 0,
        offset: 35,
      },
      {
        name: 'wrapped',
        props: {value: 'abcdefghij', wrap: true},
        width: 5,
        height: 3,
        x: 4,
        y: 1,
        offset: 9,
      },
      {
        name: 'wrapped multiline',
        props: {value: 'abcdef\nxyz', wrap: true, multiline: true},
        width: 4,
        height: 4,
        x: 1,
        y: 2,
        offset: 9,
      },
      {
        name: 'wrapped and scrolled',
        props: {value: 'abcdefghijklmnop', wrap: true},
        width: 5,
        height: 2,
        x: 2,
        y: 0,
        offset: 12,
      },
      {
        name: 'first tab cell',
        props: {value: 'a\tb'},
        width: 10,
        height: 1,
        x: 1,
        y: 0,
        offset: 1,
      },
      {
        name: 'second tab cell',
        props: {value: 'a\tb'},
        width: 10,
        height: 1,
        x: 2,
        y: 0,
        offset: 1,
      },
      {
        name: 'after a tab',
        props: {value: 'a\tb'},
        width: 10,
        height: 1,
        x: 3,
        y: 0,
        offset: 2,
      },
      {
        name: 'wide grapheme',
        props: {value: 'a界b'},
        width: 10,
        height: 1,
        x: 2,
        y: 0,
        offset: 1,
      },
      {
        name: 'after emoji and combining grapheme',
        props: {value: '👩‍💻éx'},
        width: 10,
        height: 1,
        x: 3,
        y: 0,
        offset: 2,
      },
      {
        name: 'wrapped wide grapheme',
        props: {value: 'a界bcdef', wrap: true},
        width: 4,
        height: 3,
        x: 1,
        y: 1,
        offset: 4,
      },
      {
        name: 'custom font',
        props: {value: 'hello', font: 'serif-bold'},
        width: 10,
        height: 1,
        x: 2,
        y: 0,
        offset: 2,
      },
      {
        name: 'formatted',
        props: {value: 'hello', format: text => `\x1b[31m${text}\x1b[0m`},
        width: 10,
        height: 1,
        x: 2,
        y: 0,
        offset: 2,
      },
      {
        name: 'placeholder',
        props: {placeholder: 'type here'},
        width: 20,
        height: 1,
        x: 4,
        y: 0,
        offset: 0,
      },
      {name: 'empty', props: {}, width: 20, height: 1, x: 4, y: 0, offset: 0},
    ]

    it.each(cases)(
      'maps $name text to grapheme offsets',
      ({props, width, height, x, y, offset}) => {
        const input = new Input(props)
        const t = testRender(input, {width, height})
        const before = t.terminal.textContent()
        click(t, x, y)
        expect(t.terminal.textContent()).toBe(before)
        t.tick(DBL_CLICK)
        expect(input.minSelected()).toBe(offset)
        expect({before, after: t.terminal.textContent()}).toMatchSnapshot()
        t.sendKey('!')
        const chars = unicode.printableChars(props.value ?? '')
        expect(input.value).toBe(
          [...chars.slice(0, offset), '!', ...chars.slice(offset)].join(''),
        )
      },
    )

    it('uses Input-local coordinates inside a padded container', () => {
      const input = new Input({value: 'hello', padding: {left: 2, top: 1}})
      const t = testRender(new Box({border: 'single', child: input}), {
        width: 20,
        height: 5,
      })
      click(t, 5, 2)
      t.tick(DBL_CLICK)
      expect(input.minSelected()).toBe(2)
    })

    it('focuses but ignores clicks on rows with no text mapping', () => {
      const input = new Input({value: 'hello', multiline: true})
      const t = testRender(input, {width: 20, height: 3})
      t.sendKey('tab')
      click(t, 2, 2)
      t.tick(DBL_CLICK)
      expect(input.minSelected()).toBe(5)
      t.sendKey('!')
      expect(input.value).toBe('hello!')
    })

    it('maps hidden tab cells without making alt-click a selection gesture', () => {
      const input = new Input({value: 'a\tb'})
      const t = testRender(input, {width: 10, height: 1})
      t.sendMouse('mouse.button.down', {x: 0, y: 0}, {alt: true})
      t.sendMouse('mouse.button.up', {x: 0, y: 0}, {alt: true})
      t.tick(DBL_CLICK)
      expect(input.minSelected()).toBe(3)
      click(t, 2)
      t.tick(DBL_CLICK)
      expect(input.minSelected()).toBe(1)
    })
  })

  describe('double clicks', () => {
    it('selects the original word on the second press before scrolling', () => {
      const input = new Input({value: 'zero one two three four five'})
      const t = testRender(input, {width: 15, height: 1})
      const before = t.terminal.textContent()
      click(t, 1) // 'r' in 'three', with the beginning of the value off-screen
      t.tick(DBL_CLICK - 1)
      expect(t.terminal.textContent()).toBe(before)
      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      expect([input.minSelected(), input.maxSelected()]).toEqual([13, 18])
      expect({before, selected: t.terminal.textContent()}).toMatchSnapshot()
      t.sendMouse('mouse.button.up', {x: 1, y: 0})
      t.tick(DBL_CLICK * 2)
      expect([input.minSelected(), input.maxSelected()]).toEqual([13, 18])
      t.sendPaste('THREE')
      expect(input.value).toBe('zero one two THREE four five')
    })

    it.each([
      {value: 'hello world', x: 4, start: 0, end: 5},
      {value: 'hello world', x: 6, start: 6, end: 11},
      {value: 'one   two', x: 4, start: 3, end: 6},
      {value: 'one,two', x: 3, start: 3, end: 4},
      {value: '👩‍💻 café!', x: 5, start: 2, end: 6},
    ])('selects the segment at $x in "$value"', ({value, x, start, end}) => {
      const input = new Input({value})
      const t = testRender(input, {width: 20, height: 1})
      click(t, x)
      click(t, x)
      expect([input.minSelected(), input.maxSelected()]).toEqual([start, end])
    })

    it('restarts the timer for a different location without moving the old cursor', () => {
      const input = new Input({value: 'hello world'})
      const t = testRender(input, {width: 20, height: 1})
      click(t, 1)
      t.tick(200)
      click(t, 7)
      t.tick(200)
      expect(input.minSelected()).toBe(11)
      t.tick(100)
      expect(input.minSelected()).toBe(7)
    })

    it('does not double-click once the interval has expired', () => {
      const input = new Input({value: 'hello world'})
      const t = testRender(input, {width: 20, height: 1})
      click(t, 1)
      t.tick(DBL_CLICK)
      click(t, 1)
      t.tick(DBL_CLICK)
      expect([input.minSelected(), input.maxSelected()]).toEqual([1, 2])
    })

    it('keeps an empty selection on the trailing cursor cell', () => {
      const input = new Input({value: 'hello'})
      const t = testRender(input, {width: 20, height: 1})
      click(t, 10)
      click(t, 10)
      t.sendKey('!')
      expect(input.value).toBe('hello!')
    })
  })

  describe('triple clicks', () => {
    it.each([
      {
        name: 'single line',
        value: 'hello world',
        x: 2,
        y: 0,
        start: 0,
        end: 11,
      },
      {
        name: 'first line',
        value: 'one two\nthree four\nfive',
        x: 1,
        y: 0,
        start: 0,
        end: 8,
      },
      {
        name: 'middle line',
        value: 'one two\nthree four\nfive',
        x: 1,
        y: 1,
        start: 8,
        end: 19,
      },
      {
        name: 'last line',
        value: 'one two\nthree four\nfive',
        x: 1,
        y: 2,
        start: 19,
        end: 23,
      },
      {name: 'newline cell', value: 'one\ntwo', x: 3, y: 0, start: 0, end: 4},
      {
        name: 'past the last character',
        value: 'one\ntwo',
        x: 15,
        y: 1,
        start: 4,
        end: 7,
      },
      {name: 'empty line', value: 'one\n\ntwo', x: 5, y: 1, start: 4, end: 5},
      {
        name: 'trailing empty line',
        value: 'one\n',
        x: 5,
        y: 1,
        start: 4,
        end: 4,
      },
      {
        name: 'Unicode and tabs',
        value: 'first\n👩‍💻\tcafé!\nlast',
        x: 5,
        y: 1,
        start: 6,
        end: 14,
      },
      {name: 'placeholder', value: '', x: 3, y: 0, start: 0, end: 0},
    ])('selects the $name', ({value, x, y, start, end}) => {
      const onChange = vi.fn()
      const input = new Input({
        value,
        multiline: true,
        placeholder: 'Type here',
        onChange,
      })
      const t = testRender(input, {width: 30, height: 4})
      click(t, x, y)
      click(t, x, y)
      t.sendMouse('mouse.button.down', {x, y})
      const range = [start, start === end ? start + 1 : end]
      expect([input.minSelected(), input.maxSelected()]).toEqual(range)
      t.sendMouse('mouse.button.up', {x, y})
      t.tick(DBL_CLICK * 2)
      expect([input.minSelected(), input.maxSelected()]).toEqual(range)
      expect(onChange).not.toHaveBeenCalled()
      t.sendPaste('!')
      const chars = unicode.printableChars(value)
      expect(input.value).toBe(
        [...chars.slice(0, start), '!', ...chars.slice(end)].join(''),
      )
    })

    it('selects the original line after double-click scrolls a different line under the mouse', () => {
      const input = new Input({
        value: 'zero\none\ntwo\nthree\nfour',
        multiline: true,
      })
      const t = testRender(input, {width: 10, height: 3})
      const before = t.terminal.textContent()
      click(t, 1)
      click(t, 1)
      expect([input.minSelected(), input.maxSelected()]).toEqual([9, 12])
      const word = t.terminal.textContent()
      expect(word).not.toBe(before)
      t.tick(DBL_CLICK - 1)
      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      expect([input.minSelected(), input.maxSelected()]).toEqual([9, 13])
      expect({before, word, line: t.terminal.textContent()}).toMatchSnapshot()
      t.sendMouse('mouse.button.up', {x: 1, y: 0})
      t.sendPaste('replacement\n')
      expect(input.value).toBe('zero\none\nreplacement\nthree\nfour')
    })

    it('selects the whole logical line across wrapped rows', () => {
      const input = new Input({value: 'zero one two three four', wrap: true})
      const t = testRender(input, {width: 5, height: 3})
      const before = t.terminal.textContent()
      click(t, 2, 1)
      click(t, 2, 1)
      const word = t.terminal.textContent()
      click(t, 2, 1)
      expect([input.minSelected(), input.maxSelected()]).toEqual([0, 23])
      expect({before, word, line: t.terminal.textContent()}).toMatchSnapshot()
      t.sendKey('!')
      expect(input.value).toBe('!')
    })

    it('starts the third-click window when the second press is released', () => {
      const input = new Input({value: 'hello world'})
      const t = testRender(input, {width: 20, height: 1})
      click(t, 1)
      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      t.tick(DBL_CLICK * 2)
      expect([input.minSelected(), input.maxSelected()]).toEqual([0, 5])
      t.sendMouse('mouse.button.up', {x: 1, y: 0})
      t.tick(DBL_CLICK - 1)
      click(t, 1)
      expect([input.minSelected(), input.maxSelected()]).toEqual([0, 11])
    })

    it('leaves the word selected when the third-click window expires', () => {
      const input = new Input({value: 'hello world'})
      const t = testRender(input, {width: 20, height: 1})
      click(t, 1)
      click(t, 1)
      t.tick(DBL_CLICK)
      expect([input.minSelected(), input.maxSelected()]).toEqual([0, 5])
      click(t, 1)
      expect([input.minSelected(), input.maxSelected()]).toEqual([0, 5])
      t.tick(DBL_CLICK)
      expect([input.minSelected(), input.maxSelected()]).toEqual([1, 2])
    })

    it('starts a new single click at a different position', () => {
      const input = new Input({value: 'hello world'})
      const t = testRender(input, {width: 20, height: 1})
      click(t, 1)
      click(t, 1)
      click(t, 7)
      t.tick(DBL_CLICK)
      expect([input.minSelected(), input.maxSelected()]).toEqual([7, 8])
    })

    it('does not continue the sequence after dragging the second press', () => {
      const input = new Input({value: 'hello world'})
      const t = testRender(input, {width: 20, height: 1})
      click(t, 1)
      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      t.sendMouse('mouse.button.down', {x: 2, y: 0})
      t.sendMouse('mouse.button.up', {x: 1, y: 0})
      click(t, 1)
      expect([input.minSelected(), input.maxSelected()]).toEqual([0, 5])
      t.tick(DBL_CLICK)
      expect([input.minSelected(), input.maxSelected()]).toEqual([1, 2])
    })

    it('replaces the selected word when typing before the third-click window expires', () => {
      const input = new Input({value: 'hello world'})
      const t = testRender(input, {width: 20, height: 1})
      click(t, 1)
      click(t, 1)
      t.sendKey('!')
      expect(input.value).toBe('! world')
      t.tick(DBL_CLICK)
      expect(input.minSelected()).toBe(1)
    })

    it('gives shift-click precedence over triple-click', () => {
      const input = new Input({value: 'hello world'})
      const t = testRender(input, {width: 20, height: 1})
      click(t, 1)
      click(t, 1)
      t.sendMouse('mouse.button.down', {x: 1, y: 0}, {shift: true})
      expect([input.minSelected(), input.maxSelected()]).toEqual([0, 5])
      t.sendMouse('mouse.button.up', {x: 1, y: 0}, {shift: true})
      expect([input.minSelected(), input.maxSelected()]).toEqual([0, 1])
      t.tick(DBL_CLICK)
      expect([input.minSelected(), input.maxSelected()]).toEqual([0, 1])
    })

    it('discards the original click offset after a value change', () => {
      const input = new Input({value: 'hello world'})
      const t = testRender(input, {width: 20, height: 1})
      click(t, 8)
      click(t, 8)
      input.value = 'a b'
      t.render()
      click(t, 8)
      t.tick(DBL_CLICK)
      expect([input.minSelected(), input.maxSelected()]).toEqual([3, 4])
    })

    it('starts a new sequence on the fourth click', () => {
      const input = new Input({value: 'hello world'})
      const t = testRender(input, {width: 20, height: 1})
      click(t, 1)
      click(t, 1)
      click(t, 1)
      click(t, 1)
      expect([input.minSelected(), input.maxSelected()]).toEqual([0, 11])
      t.tick(DBL_CLICK)
      expect([input.minSelected(), input.maxSelected()]).toEqual([1, 2])
    })
  })

  describe('dragging', () => {
    it('highlights live without scrolling until release', () => {
      const input = new Input({
        value: '0123456789abcdefghij',
        purpose: 'primary',
      })
      const t = testRender(input, {width: 10, height: 1})
      const before = t.terminal.textContent()
      t.sendMouse('mouse.button.down', {x: 1, y: 0}) // offset 12
      t.sendMouse('mouse.button.down', {x: 5, y: 0}) // offset 16
      expect(input.minSelected()).toBe(20)
      expect(t.terminal.textContent()).toBe(before)
      expect(t.terminal.styleAt(1, 0).background).toEqual(
        t.terminal.styleAt(4, 0).background,
      )
      expect(t.terminal.styleAt(1, 0).background).not.toEqual(
        t.terminal.styleAt(5, 0).background,
      )
      t.tick(DBL_CLICK * 2)
      t.sendMouse('mouse.button.down', {x: 3, y: 0}) // offset 14, still frozen
      expect(t.terminal.textContent()).toBe(before)
      expect(t.terminal.styleAt(2, 0).background).not.toEqual(
        t.terminal.styleAt(3, 0).background,
      )
      t.sendMouse('mouse.button.up', {x: 3, y: 0})
      expect([input.minSelected(), input.maxSelected()]).toEqual([12, 14])
      expect(t.terminal.textContent()).not.toBe(before)
      expect({before, after: t.terminal.textContent()}).toMatchSnapshot()
      t.sendKey('!')
      expect(input.value).toBe('0123456789ab!efghij')
    })

    it.each([false, true])('selects across rows (reverse: %s)', reverse => {
      const input = new Input({value: 'abc\ndef\nghi', multiline: true})
      const t = testRender(input, {width: 10, height: 3})
      const start = {x: 1, y: reverse ? 2 : 0}
      const end = {x: 1, y: reverse ? 0 : 2}
      t.sendMouse('mouse.button.down', start)
      t.sendMouse('mouse.button.down', end)
      expect(input.minSelected()).toBe(11)
      t.sendMouse('mouse.button.up', end)
      expect([input.minSelected(), input.maxSelected()]).toEqual([1, 9])
      t.sendKey('!')
      expect(input.value).toBe('a!hi')
    })

    it('freezes the vertical offset during dragging', () => {
      const input = new Input({
        value: 'zero\none\ntwo\nthree\nfour',
        multiline: true,
      })
      const t = testRender(input, {width: 10, height: 3})
      const before = t.terminal.textContent()
      t.sendMouse('mouse.button.down', {x: 1, y: 0}) // 'w', offset 10
      t.sendMouse('mouse.button.down', {x: 3, y: 1}) // 'e', offset 16
      expect(t.terminal.textContent()).toBe(before)
      t.sendMouse('mouse.button.up', {x: 3, y: 1})
      expect([input.minSelected(), input.maxSelected()]).toEqual([10, 16])
    })

    it('selects across wrapped rows', () => {
      const input = new Input({value: 'abcdefghijkl', wrap: true})
      const t = testRender(input, {width: 5, height: 3})
      t.sendMouse('mouse.button.down', {x: 3, y: 0})
      t.sendMouse('mouse.button.down', {x: 2, y: 1})
      t.sendMouse('mouse.button.up', {x: 2, y: 1})
      expect([input.minSelected(), input.maxSelected()]).toEqual([3, 7])
      t.sendPaste('!')
      expect(input.value).toBe('abc!hijkl')
    })

    it('uses the release position even without a final drag event', () => {
      const input = new Input({value: 'abcdefghij'})
      const t = testRender(input, {width: 20, height: 1})
      t.sendMouse('mouse.button.down', {x: 2, y: 0})
      t.sendMouse('mouse.button.up', {x: 6, y: 0})
      expect([input.minSelected(), input.maxSelected()]).toEqual([2, 6])
      t.tick(DBL_CLICK)
      expect([input.minSelected(), input.maxSelected()]).toEqual([2, 6])
    })

    it('does not mistake a drag back to the anchor for a click', () => {
      const input = new Input({value: 'abcdef'})
      const t = testRender(input, {width: 10, height: 1})
      t.sendMouse('mouse.button.down', {x: 2, y: 0})
      t.sendMouse('mouse.button.down', {x: 4, y: 0})
      t.sendMouse('mouse.button.up', {x: 2, y: 0})
      expect(input.minSelected()).toBe(2)
      click(t, 2)
      expect([input.minSelected(), input.maxSelected()]).toEqual([2, 3])
    })

    it('cancels a pending click when starting a drag elsewhere', () => {
      const input = new Input({value: 'abcdef'})
      const t = testRender(input, {width: 10, height: 1})
      click(t, 0)
      t.sendMouse('mouse.button.down', {x: 2, y: 0})
      t.sendMouse('mouse.button.down', {x: 4, y: 0})
      t.tick(DBL_CLICK * 2)
      expect(input.minSelected()).toBe(6)
      t.sendMouse('mouse.button.up', {x: 4, y: 0})
      expect([input.minSelected(), input.maxSelected()]).toEqual([2, 4])
    })

    it('clamps horizontally outside and commits on release outside', () => {
      const input = new Input({value: 'abcdef'})
      const t = testRender(input, {width: 10, height: 1})
      t.sendMouse('mouse.button.down', {x: 2, y: 0})
      t.sendMouse('mouse.button.down', {x: 12, y: 0})
      t.sendMouse('mouse.button.up', {x: 15, y: 0})
      expect([input.minSelected(), input.maxSelected()]).toEqual([2, 6])
      // A subsequent gesture must not reuse the old anchor.
      t.sendMouse('mouse.button.down', {x: 3, y: 0})
      t.sendMouse('mouse.button.up', {x: -3, y: 0})
      expect([input.minSelected(), input.maxSelected()]).toEqual([0, 3])
    })

    it('preserves the last mapped endpoint outside vertically, and can reenter', () => {
      const input = new Input({value: 'abcdef'})
      const t = testRender(input, {width: 10, height: 1})
      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      t.sendMouse('mouse.button.down', {x: 3, y: 0})
      t.sendMouse('mouse.button.down', {x: 6, y: 5})
      t.sendMouse('mouse.button.down', {x: 4, y: 0})
      t.sendMouse('mouse.button.up', {x: 8, y: 5})
      expect([input.minSelected(), input.maxSelected()]).toEqual([1, 4])
    })
  })

  describe('shift-click', () => {
    it('previews on press and commits on release without a click timer', () => {
      const input = new Input({value: 'hello world', purpose: 'primary'})
      const t = testRender(input, {width: 20, height: 1})
      const background = t.terminal.styleAt(0, 0).background
      t.sendMouse('mouse.button.down', {x: 6, y: 0}, {shift: true})
      expect(input.minSelected()).toBe(11)
      expect(t.terminal.styleAt(6, 0).background).not.toEqual(background)
      expect(t.terminal.styleAt(10, 0).background).toEqual(
        t.terminal.styleAt(6, 0).background,
      )
      expect(t.terminal.styleAt(5, 0).background).toEqual(background)
      t.tick(DBL_CLICK * 2)
      expect(input.minSelected()).toBe(11)
      // Releasing Shift before the mouse does not change the gesture.
      t.sendMouse('mouse.button.up', {x: 6, y: 0})
      expect([input.minSelected(), input.maxSelected()]).toEqual([6, 11])
      t.tick(DBL_CLICK * 2)
      expect([input.minSelected(), input.maxSelected()]).toEqual([6, 11])
      t.sendKey('!')
      expect(input.value).toBe('hello !')
    })

    it('freezes scrolling on press and drag, using the final release endpoint', () => {
      const input = new Input({
        value: '0123456789abcdefghij',
        purpose: 'primary',
      })
      const t = testRender(input, {width: 10, height: 1})
      const before = t.terminal.textContent()
      const background = JSON.stringify(t.terminal.styleAt(0, 0).background)
      const preview = () => ({
        text: t.terminal.textContent(),
        selected: Array.from({length: 10}, (_, x) =>
          JSON.stringify(t.terminal.styleAt(x, 0).background) === background
            ? '.'
            : '#',
        ).join(''),
      })
      t.sendMouse('mouse.button.down', {x: 1, y: 0}, {shift: true}) // offset 12
      expect(t.terminal.textContent()).toBe(before)
      const pressed = preview()
      // Drag events do not need to carry the original modifier.
      t.sendMouse('mouse.button.down', {x: 5, y: 0}) // offset 16
      expect(t.terminal.textContent()).toBe(before)
      expect(input.minSelected()).toBe(20)
      const dragged = preview()
      t.sendMouse('mouse.button.up', {x: 3, y: 0}) // offset 14
      expect([input.minSelected(), input.maxSelected()]).toEqual([14, 20])
      expect(t.terminal.textContent()).not.toBe(before)
      expect({
        pressed,
        dragged,
        committed: t.terminal.textContent(),
      }).toMatchSnapshot()
      // The original cursor remains the anchor; keyboard extension moves the endpoint.
      t.sendKey('right', {shift: true})
      expect([input.minSelected(), input.maxSelected()]).toEqual([15, 20])
      t.sendPaste('!')
      expect(input.value).toBe('0123456789abcde!')
    })

    it.each([false, true])(
      'preserves an existing selection anchor (reverse: %s)',
      reverse => {
        const input = new Input({value: 'abcdefghij'})
        const t = testRender(input, {width: 20, height: 1})
        const anchor = reverse ? 6 : 2
        t.sendMouse('mouse.button.down', {x: anchor, y: 0})
        t.sendMouse('mouse.button.up', {x: reverse ? 2 : 6, y: 0})
        t.sendMouse('mouse.button.down', {x: 4, y: 0}, {shift: true})
        expect([input.minSelected(), input.maxSelected()]).toEqual([2, 6])
        t.sendMouse('mouse.button.up', {x: 4, y: 0}, {shift: true})
        expect([input.minSelected(), input.maxSelected()]).toEqual([
          Math.min(anchor, 4),
          Math.max(anchor, 4),
        ])
        t.sendMouse('mouse.button.down', {x: 8, y: 0}, {shift: true})
        t.sendMouse('mouse.button.up', {x: 8, y: 0}, {shift: true})
        expect([input.minSelected(), input.maxSelected()]).toEqual([anchor, 8])
        t.sendKey('left', {shift: true})
        expect([input.minSelected(), input.maxSelected()]).toEqual([anchor, 7])
      },
    )

    it.each([
      {
        props: {value: 'abcdefghijkl', wrap: true},
        width: 5,
        height: 3,
        x: 2,
        y: 1,
        offset: 7,
        end: 12,
      },
      {
        props: {value: 'abc\ndef\nghi', multiline: true},
        width: 10,
        height: 3,
        x: 1,
        y: 1,
        offset: 5,
        end: 11,
      },
      {
        props: {value: 'a\t界bc'},
        width: 10,
        height: 1,
        x: 4,
        y: 0,
        offset: 2,
        end: 5,
      },
    ])(
      'extends through the rendered hit map: $props',
      ({props, width, height, x, y, offset, end}) => {
        const input = new Input(props)
        const t = testRender(input, {width, height})
        t.sendMouse('mouse.button.down', {x, y}, {shift: true})
        expect(input.minSelected()).toBe(end)
        t.sendMouse('mouse.button.up', {x, y}, {shift: true})
        expect([input.minSelected(), input.maxSelected()]).toEqual([
          offset,
          end,
        ])
      },
    )

    it.each([1, 7])(
      'cancels a pending plain click without double-clicking at x=%s',
      x => {
        const input = new Input({value: 'hello world'})
        const t = testRender(input, {width: 20, height: 1})
        click(t, 1)
        t.sendMouse('mouse.button.down', {x, y: 0}, {shift: true})
        t.tick(DBL_CLICK * 2)
        expect(input.minSelected()).toBe(11)
        t.sendMouse('mouse.button.up', {x, y: 0}, {shift: true})
        expect([input.minSelected(), input.maxSelected()]).toEqual([x, 11])
        // Shift-click must not seed a subsequent double-click either.
        click(t, x)
        expect([input.minSelected(), input.maxSelected()]).toEqual([x, 11])
        t.tick(DBL_CLICK)
        expect([input.minSelected(), input.maxSelected()]).toEqual([x, x + 1])
      },
    )

    it('retains the last mapped endpoint when released outside vertically', () => {
      const input = new Input({value: 'abcdef'})
      const t = testRender(input, {width: 10, height: 1})
      t.sendMouse('mouse.button.down', {x: 2, y: 0}, {shift: true})
      t.sendMouse('mouse.button.down', {x: 4, y: 0}, {shift: true})
      t.sendMouse('mouse.button.up', {x: 9, y: 2}, {shift: true})
      expect([input.minSelected(), input.maxSelected()]).toEqual([4, 6])
    })

    it('ignores unmapped rows without changing the selection', () => {
      const input = new Input({value: 'hello', multiline: true})
      const t = testRender(input, {width: 20, height: 3})
      t.sendKey('left', {shift: true})
      t.sendMouse('mouse.button.down', {x: 1, y: 2}, {shift: true})
      t.sendMouse('mouse.button.up', {x: 1, y: 2}, {shift: true})
      t.tick(DBL_CLICK)
      expect([input.minSelected(), input.maxSelected()]).toEqual([4, 5])
    })

    it('cancels the preview on blur', () => {
      const input = new Input({value: 'hello'})
      const t = testRender(input, {width: 20, height: 1})
      t.sendMouse('mouse.button.down', {x: 1, y: 0}, {shift: true})
      t.sendKey('tab')
      t.sendMouse('mouse.button.up', {x: 1, y: 0}, {shift: true})
      t.tick(DBL_CLICK)
      expect(input.minSelected()).toBe(5)
    })
  })

  describe('gesture lifecycle', () => {
    it.each(['key', 'paste'])(
      'commits a pending click before %s input',
      method => {
        const input = new Input({value: 'hello'})
        const t = testRender(input, {width: 10, height: 1})
        click(t, 1)
        if (method === 'key') {
          t.sendKey('!')
        } else {
          t.sendPaste('!')
        }
        expect(input.value).toBe('h!ello')
        t.tick(DBL_CLICK)
        expect(input.minSelected()).toBe(2)
      },
    )

    it('clears pending clicks on blur', () => {
      const input = new Input({value: 'hello'})
      const t = testRender(input, {width: 10, height: 1})
      click(t, 1)
      t.sendKey('tab')
      t.tick(DBL_CLICK)
      expect(input.minSelected()).toBe(5)
    })

    it('clears pending clicks on unmount', () => {
      const input = new Input({value: 'hello'})
      const box = new Box({child: input})
      const t = testRender(box, {width: 10, height: 1})
      click(t, 1)
      box.removeChild(input)
      box.add(input)
      t.render()
      t.tick(DBL_CLICK)
      expect(input.minSelected()).toBe(5)
    })

    it('clears stale clicks and hit regions when the value changes', () => {
      const input = new Input({value: 'hello'})
      const t = testRender(input, {width: 10, height: 1})
      click(t, 1)
      input.value = ''
      t.render()
      t.tick(DBL_CLICK)
      expect(input.minSelected()).toBe(0)
      click(t, 4)
      t.tick(DBL_CLICK)
      t.sendKey('!')
      expect(input.value).toBe('!')
    })

    it('breaks insert undo coalescing even when clicking the current cursor', () => {
      const input = new Input()
      const t = testRender(input, {width: 10, height: 1})
      t.sendKey('a')
      click(t, 1)
      t.tick(DBL_CLICK)
      t.sendKey('b')
      t.sendKey('z', {ctrl: true})
      expect(input.value).toBe('a')
    })
  })
})
