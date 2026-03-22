import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Scrollable} from '../../lib/components/Scrollable.js'
import {Stack} from '../../lib/components/Stack.js'
import {Text} from '../../lib/components/Text.js'

function makeLines(count: number): Text[] {
  return Array.from({length: count}, (_, i) => new Text({text: `Line ${i}`}))
}

function makeScrollable(
  lineCount: number,
  props: {
    keepAtBottom?: boolean
    showScrollbars?: boolean
    scrollHeight?: number
    scrollWidth?: number
  } = {},
) {
  return new Scrollable({
    ...props,
    children: [
      new Stack({
        direction: 'down',
        children: makeLines(lineCount),
      }),
    ],
  })
}

/** Creates a scrollable with one wide text child (horizontal overflow). */
function makeWideScrollable(
  text: string,
  props: {showScrollbars?: boolean; scrollWidth?: number} = {},
) {
  return new Scrollable({
    ...props,
    children: [new Text({text})],
  })
}

/** Creates a scrollable with content that overflows in both directions. */
function makeBothOverflow(props: {showScrollbars?: boolean} = {}) {
  const lines = Array.from(
    {length: 10},
    (_, i) => new Text({text: `Row${i}-${'abcdefghijklmnopqrstuvwxyz'}`}),
  )
  return new Scrollable({
    ...props,
    children: [new Stack({direction: 'down', children: lines})],
  })
}

describe('Scrollable', () => {
  describe('basic rendering', () => {
    it('renders content that fits without scrolling', () => {
      const t = testRender(makeScrollable(3), {width: 10, height: 3})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('clips content that overflows vertically', () => {
      const t = testRender(makeScrollable(10), {width: 10, height: 3})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders empty scrollable without crashing', () => {
      const scrollable = new Scrollable({children: []})
      const t = testRender(scrollable, {width: 10, height: 5})
      expect(t.terminal.textContent()).toBeDefined()
    })

    it('content exactly fits viewport — no scrollbars needed', () => {
      const t = testRender(makeScrollable(3), {width: 10, height: 3})
      const lastCol = t.terminal.charAt(9, 0)
      expect(lastCol).not.toBe('█')
    })
  })

  describe('scrollbar rendering', () => {
    it('shows vertical scrollbar when content overflows vertically', () => {
      const t = testRender(makeScrollable(10), {width: 10, height: 5})
      let hasIndicator = false
      for (let y = 0; y < 5; y++) {
        if (t.terminal.charAt(9, y) === '█') {
          hasIndicator = true
          break
        }
      }
      expect(hasIndicator).toBe(true)
    })

    it('shows horizontal scrollbar when content overflows horizontally', () => {
      const wideText = 'A'.repeat(30)
      const t = testRender(makeWideScrollable(wideText), {width: 10, height: 3})
      let hasIndicator = false
      for (let x = 0; x < 10; x++) {
        if (t.terminal.charAt(x, 2) === '█') {
          hasIndicator = true
          break
        }
      }
      expect(hasIndicator).toBe(true)
    })

    it('shows both scrollbars and corner block when overflowing both ways', () => {
      const t = testRender(makeBothOverflow(), {width: 10, height: 5})
      expect(t.terminal.charAt(9, 4)).toBe('█')
      let hasVertical = false
      for (let y = 0; y < 4; y++) {
        if (t.terminal.charAt(9, y) === '█') {
          hasVertical = true
          break
        }
      }
      expect(hasVertical).toBe(true)
      let hasHorizontal = false
      for (let x = 0; x < 9; x++) {
        if (t.terminal.charAt(x, 4) === '█') {
          hasHorizontal = true
          break
        }
      }
      expect(hasHorizontal).toBe(true)
    })

    it('hides scrollbars when showScrollbars is false', () => {
      const t = testRender(makeScrollable(10, {showScrollbars: false}), {
        width: 10,
        height: 5,
      })
      for (let y = 0; y < 5; y++) {
        expect(t.terminal.charAt(9, y)).not.toBe('█')
      }
    })

    it('scrollbar indicator position changes after scrolling', () => {
      const t = testRender(makeScrollable(20), {width: 10, height: 5})

      let initialY = -1
      for (let y = 0; y < 5; y++) {
        const row = t.terminal.getRow(y, 9, 10)
        if (row === '█') {
          initialY = y
          break
        }
      }
      expect(initialY).toBeGreaterThanOrEqual(0)

      for (let i = 0; i < 10; i++) {
        t.sendMouse('mouse.wheel.down', {x: 0, y: 0})
      }
      t.render()

      let newY = -1
      for (let y = 0; y < 5; y++) {
        const row = t.terminal.getRow(y, 9, 10)
        if (row === '█') {
          newY = y
          break
        }
      }
      expect(newY).toBeGreaterThan(initialY)
    })
  })

  describe('vertical mouse wheel scrolling', () => {
    it('scrolls down on wheel down', () => {
      const t = testRender(makeScrollable(10), {width: 10, height: 3})
      expect(t.terminal.textAtRow(0)).toContain('Line 0')

      t.sendMouse('mouse.wheel.down', {x: 0, y: 0})
      t.render()
      expect(t.terminal.textAtRow(0)).toContain('Line 1')
    })

    it('scrolls up on wheel up', () => {
      const t = testRender(makeScrollable(10), {width: 10, height: 3})

      t.sendMouse('mouse.wheel.down', {x: 0, y: 0})
      t.sendMouse('mouse.wheel.down', {x: 0, y: 0})
      t.render()
      expect(t.terminal.textAtRow(0)).toContain('Line 2')

      t.sendMouse('mouse.wheel.up', {x: 0, y: 0})
      t.render()
      expect(t.terminal.textAtRow(0)).toContain('Line 1')
    })

    it('does not scroll past the top', () => {
      const t = testRender(makeScrollable(10), {width: 10, height: 3})

      t.sendMouse('mouse.wheel.up', {x: 0, y: 0})
      t.render()
      expect(t.terminal.textAtRow(0)).toContain('Line 0')
    })

    it('does not scroll past the bottom', () => {
      const t = testRender(makeScrollable(5), {width: 10, height: 3})

      for (let i = 0; i < 20; i++) {
        t.sendMouse('mouse.wheel.down', {x: 0, y: 0})
      }
      t.render()
      expect(t.terminal.textAtRow(2)).toContain('Line 4')
    })
  })

  describe('horizontal scrolling', () => {
    it('wheel.left scrolls content left, revealing right side', () => {
      const wideText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      const t = testRender(
        makeWideScrollable(wideText, {showScrollbars: false}),
        {width: 10, height: 1},
      )
      expect(t.terminal.textAtRow(0)).toContain('A')

      t.sendMouse('mouse.wheel.left', {x: 0, y: 0})
      t.sendMouse('mouse.wheel.left', {x: 0, y: 0})
      t.render()
      expect(t.terminal.textAtRow(0)).not.toContain('A')
      expect(t.terminal.textAtRow(0)).toContain('E')

      t.sendMouse('mouse.wheel.right', {x: 0, y: 0})
      t.render()
      expect(t.terminal.textAtRow(0)).toContain('C')
    })

    it('vertical wheel scrolls horizontally when content only overflows horizontally', () => {
      const wideText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      const t = testRender(
        makeWideScrollable(wideText, {showScrollbars: false}),
        {width: 10, height: 1},
      )
      expect(t.terminal.textAtRow(0)).toContain('A')

      t.sendMouse('mouse.wheel.down', {x: 0, y: 0})
      t.render()
      expect(t.terminal.textAtRow(0)).not.toContain('A')
    })
  })

  describe('scrollHeight and scrollWidth props', () => {
    it('scrollHeight controls vertical scroll amount', () => {
      const t = testRender(
        makeScrollable(20, {scrollHeight: 3, showScrollbars: false}),
        {width: 10, height: 5},
      )
      expect(t.terminal.textAtRow(0)).toContain('Line 0')

      t.sendMouse('mouse.wheel.down', {x: 0, y: 0})
      t.render()
      expect(t.terminal.textAtRow(0)).toContain('Line 3')
    })

    it('scrollWidth controls horizontal scroll amount', () => {
      const wideText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      const scrollable = new Scrollable({
        scrollWidth: 5,
        showScrollbars: false,
        children: [new Text({text: wideText})],
      })
      const t = testRender(scrollable, {width: 10, height: 1})
      expect(t.terminal.textAtRow(0)).toContain('A')

      t.sendMouse('mouse.wheel.left', {x: 0, y: 0})
      t.render()
      expect(t.terminal.textAtRow(0)).not.toContain('A')
      expect(t.terminal.textAtRow(0)).toContain('F')
    })
  })

  describe('ctrl+wheel fast scrolling', () => {
    it('ctrl multiplies vertical scroll by 5', () => {
      const t = testRender(makeScrollable(30, {showScrollbars: false}), {
        width: 10,
        height: 5,
      })
      expect(t.terminal.textAtRow(0)).toContain('Line 0')

      t.sendMouse('mouse.wheel.down', {x: 0, y: 0}, {ctrl: true})
      t.render()
      expect(t.terminal.textAtRow(0)).toContain('Line 5')
    })

    it('ctrl multiplies horizontal scroll by 5', () => {
      const wideText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      const scrollable = new Scrollable({
        showScrollbars: false,
        children: [new Text({text: wideText})],
      })
      const t = testRender(scrollable, {width: 10, height: 1})

      t.sendMouse('mouse.wheel.left', {x: 0, y: 0}, {ctrl: true})
      t.render()
      expect(t.terminal.textAtRow(0)).toContain('K')
    })

    it('ctrl + custom scrollHeight stacks', () => {
      const t = testRender(
        makeScrollable(50, {scrollHeight: 2, showScrollbars: false}),
        {width: 10, height: 5},
      )

      t.sendMouse('mouse.wheel.down', {x: 0, y: 0}, {ctrl: true})
      t.render()
      expect(t.terminal.textAtRow(0)).toContain('Line 10')
    })
  })

  describe('mouse click on scrollbar track', () => {
    it('clicking vertical scrollbar track jumps to that position', () => {
      const t = testRender(makeScrollable(20), {width: 10, height: 5})
      expect(t.terminal.textAtRow(0)).toContain('Line 0')

      t.sendMouse('mouse.button.down', {x: 9, y: 3})
      t.render()
      expect(t.terminal.textAtRow(0)).not.toContain('Line 0')
    })

    it('clicking horizontal scrollbar track jumps to that position', () => {
      const t = testRender(makeBothOverflow(), {width: 10, height: 5})
      const initialRow = t.terminal.textAtRow(0)

      t.sendMouse('mouse.button.down', {x: 6, y: 4})
      t.render()
      expect(t.terminal.textAtRow(0)).not.toBe(initialRow)
    })

    it('mouse up releases scrollbar drag', () => {
      const t = testRender(makeScrollable(20), {width: 10, height: 5})

      t.sendMouse('mouse.button.down', {x: 9, y: 2})
      t.render()
      const posAfterClick = t.terminal.textAtRow(0)

      t.sendMouse('mouse.button.up', {x: 9, y: 2})
      t.render()

      t.sendMouse('mouse.button.down', {x: 3, y: 2})
      t.render()
      expect(t.terminal.textAtRow(0)).toBe(posAfterClick)
    })
  })

  describe('naturalSize', () => {
    it('clamps to available size', () => {
      const scrollable = makeScrollable(20, {showScrollbars: false})
      const t = testRender(scrollable, {width: 10, height: 5})
      expect(t.terminal.textAtRow(0)).toContain('Line 0')
      expect(t.terminal.textAtRow(4)).toContain('Line 4')
    })
  })

  describe('scrollBy', () => {
    it('scrollBy(0, 0) is a no-op', () => {
      const scrollable = makeScrollable(10, {showScrollbars: false})
      const t = testRender(scrollable, {width: 10, height: 5})
      const before = t.terminal.textAtRow(0)

      scrollable.scrollBy(0, 0)
      t.render()

      expect(t.terminal.textAtRow(0)).toBe(before)
    })

    it('scrollBy with positive Y scrolls down', () => {
      const scrollable = makeScrollable(10, {showScrollbars: false})
      const t = testRender(scrollable, {width: 10, height: 5})

      scrollable.scrollBy(0, 3)
      t.render()
      expect(t.terminal.textAtRow(0)).toContain('Line 3')
    })

    it('scrollBy clamps to content bounds', () => {
      const scrollable = makeScrollable(10, {showScrollbars: false})
      const t = testRender(scrollable, {width: 10, height: 5})

      scrollable.scrollBy(0, 100)
      t.render()
      expect(t.terminal.textContent()).toContain('Line 9')

      scrollable.scrollBy(0, -200)
      t.render()
      expect(t.terminal.textAtRow(0)).toContain('Line 0')
    })
  })

  describe('update (prop changes)', () => {
    it('can toggle showScrollbars via update', () => {
      const scrollable = makeScrollable(10, {showScrollbars: true})
      const t = testRender(scrollable, {width: 10, height: 5})

      let hasScrollbar = false
      for (let y = 0; y < 5; y++) {
        if (t.terminal.charAt(9, y) === '█') {
          hasScrollbar = true
          break
        }
      }
      expect(hasScrollbar).toBe(true)

      scrollable.update({showScrollbars: false})
      t.render()

      hasScrollbar = false
      for (let y = 0; y < 5; y++) {
        if (t.terminal.charAt(9, y) === '█') {
          hasScrollbar = true
          break
        }
      }
      expect(hasScrollbar).toBe(false)
    })
  })

  describe('keepAtBottom', () => {
    it('defaults to false (stays at top when content grows)', () => {
      const stack = new Stack({
        direction: 'down',
        children: makeLines(3),
      })
      const scrollable = new Scrollable({children: [stack]})
      const t = testRender(scrollable, {width: 10, height: 3})
      expect(t.terminal.textAtRow(0)).toContain('Line 0')

      for (let i = 3; i < 10; i++) {
        stack.add(new Text({text: `Line ${i}`}))
      }
      t.render()

      expect(t.terminal.textAtRow(0)).toContain('Line 0')
    })

    it('auto-scrolls to bottom when content grows and was at bottom', () => {
      const stack = new Stack({
        direction: 'down',
        children: makeLines(3),
      })
      const scrollable = new Scrollable({
        keepAtBottom: true,
        showScrollbars: false,
        children: [stack],
      })
      const t = testRender(scrollable, {width: 10, height: 5})

      expect(t.terminal.textAtRow(0)).toContain('Line 0')
      expect(t.terminal.textAtRow(2)).toContain('Line 2')

      for (let i = 3; i < 10; i++) {
        stack.add(new Text({text: `Line ${i}`}))
      }
      t.render()
      t.render()

      expect(t.terminal.textAtRow(4)).toContain('Line 9')
    })

    it('does not auto-scroll when user has scrolled up', () => {
      const stack = new Stack({
        direction: 'down',
        children: makeLines(10),
      })
      const scrollable = new Scrollable({
        keepAtBottom: true,
        showScrollbars: false,
        children: [stack],
      })
      const t = testRender(scrollable, {width: 10, height: 5})
      t.render()

      expect(t.terminal.textAtRow(4)).toContain('Line 9')

      t.sendMouse('mouse.wheel.up', {x: 0, y: 0})
      t.sendMouse('mouse.wheel.up', {x: 0, y: 0})
      t.sendMouse('mouse.wheel.up', {x: 0, y: 0})
      t.render()
      const topLineAfterScroll = t.terminal.textAtRow(0)
      expect(topLineAfterScroll).not.toContain('Line 9')

      stack.add(new Text({text: 'Line 10'}))
      stack.add(new Text({text: 'Line 11'}))
      t.render()

      expect(t.terminal.textAtRow(0)).toBe(topLineAfterScroll)
    })

    it('resumes auto-scroll after user scrolls back to bottom', () => {
      const stack = new Stack({
        direction: 'down',
        children: makeLines(10),
      })
      const scrollable = new Scrollable({
        keepAtBottom: true,
        showScrollbars: false,
        children: [stack],
      })
      const t = testRender(scrollable, {width: 10, height: 5})
      t.render()

      t.sendMouse('mouse.wheel.up', {x: 0, y: 0})
      t.sendMouse('mouse.wheel.up', {x: 0, y: 0})
      t.render()

      for (let i = 0; i < 10; i++) {
        t.sendMouse('mouse.wheel.down', {x: 0, y: 0})
      }
      t.render()

      stack.add(new Text({text: 'Line 10'}))
      stack.add(new Text({text: 'Line 11'}))
      t.render()
      t.render()

      expect(t.terminal.textAtRow(4)).toContain('Line 11')
    })

    it('tracks isAtBottom through scrollbar mouse click', () => {
      const stack = new Stack({
        direction: 'down',
        children: makeLines(20),
      })
      const scrollable = new Scrollable({
        keepAtBottom: true,
        children: [stack],
      })
      const t = testRender(scrollable, {width: 10, height: 5})
      t.render()

      t.sendMouse('mouse.button.down', {x: 9, y: 0})
      t.render()
      t.sendMouse('mouse.button.up', {x: 9, y: 0})
      t.render()

      const topLine = t.terminal.textAtRow(0)

      stack.add(new Text({text: 'Line 20'}))
      t.render()

      expect(t.terminal.textAtRow(0)).toBe(topLine)
    })
  })
})
