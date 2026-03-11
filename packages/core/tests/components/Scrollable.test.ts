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
  // 10 lines of 30-char text → overflows a 10x5 viewport in both dimensions
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
  // ─── Basic rendering ───────────────────────────────────────────────

  describe('basic rendering', () => {
    it('renders content that fits without scrolling', () => {
      const t = testRender(makeScrollable(3), {width: 10, height: 3})
      expect(t.terminal.textAtRow(0)).toContain('Line 0')
      expect(t.terminal.textAtRow(1)).toContain('Line 1')
      expect(t.terminal.textAtRow(2)).toContain('Line 2')
    })

    it('clips content that overflows vertically', () => {
      const t = testRender(makeScrollable(10), {width: 10, height: 3})
      expect(t.terminal.textAtRow(0)).toContain('Line 0')
      expect(t.terminal.textAtRow(1)).toContain('Line 1')
      expect(t.terminal.textAtRow(2)).toContain('Line 2')
    })

    it('renders empty scrollable without crashing', () => {
      const scrollable = new Scrollable({children: []})
      const t = testRender(scrollable, {width: 10, height: 5})
      // Should not throw — content is empty
      expect(t.terminal.textContent()).toBeDefined()
    })

    it('content exactly fits viewport — no scrollbars needed', () => {
      // 3 lines of text ≤10 chars, viewport 10×3 — fits exactly
      const t = testRender(makeScrollable(3), {width: 10, height: 3})
      // All lines visible, no scrollbar column
      expect(t.terminal.textAtRow(0)).toContain('Line 0')
      expect(t.terminal.textAtRow(2)).toContain('Line 2')
      // The rightmost column should NOT have a scrollbar character
      const lastCol = t.terminal.charAt(9, 0)
      expect(lastCol).not.toBe('█')
    })
  })

  // ─── Scrollbar rendering ──────────────────────────────────────────

  describe('scrollbar rendering', () => {
    it('shows vertical scrollbar when content overflows vertically', () => {
      const t = testRender(makeScrollable(10), {width: 10, height: 5})
      // Scrollbar is drawn on the rightmost column (x = width - 1 = 9)
      // At least one row should have the scroll indicator '█'
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
      // Horizontal scrollbar on the bottom row (y = height - 1 = 2)
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
      // Corner block at bottom-right
      expect(t.terminal.charAt(9, 4)).toBe('█')
      // Vertical scrollbar on rightmost column
      let hasVertical = false
      for (let y = 0; y < 4; y++) {
        if (t.terminal.charAt(9, y) === '█') {
          hasVertical = true
          break
        }
      }
      expect(hasVertical).toBe(true)
      // Horizontal scrollbar on bottom row
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
      const t = testRender(
        makeScrollable(10, {showScrollbars: false}),
        {width: 10, height: 5},
      )
      // No scrollbar characters on the rightmost column
      for (let y = 0; y < 5; y++) {
        expect(t.terminal.charAt(9, y)).not.toBe('█')
      }
    })

    it('scrollbar indicator position changes after scrolling', () => {
      const t = testRender(makeScrollable(20), {width: 10, height: 5})

      // Find initial indicator position
      let initialY = -1
      for (let y = 0; y < 5; y++) {
        const row = t.terminal.getRow(y, 9, 10)
        if (row === '█') {
          initialY = y
          break
        }
      }
      expect(initialY).toBeGreaterThanOrEqual(0)

      // Scroll down a lot
      for (let i = 0; i < 10; i++) {
        t.sendMouse('mouse.wheel.down', {x: 0, y: 0})
      }
      t.render()

      // Find new indicator position — should have moved down
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

  // ─── Vertical mouse wheel scrolling ───────────────────────────────

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

  // ─── Horizontal scrolling ─────────────────────────────────────────

  describe('horizontal scrolling', () => {
    it('wheel.left scrolls content left, revealing right side', () => {
      const wideText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      const t = testRender(
        makeWideScrollable(wideText, {showScrollbars: false}),
        {width: 10, height: 1},
      )
      expect(t.terminal.textAtRow(0)).toContain('A')

      // wheel.left moves content leftward (scrollWidth=2 per event)
      t.sendMouse('mouse.wheel.left', {x: 0, y: 0})
      t.sendMouse('mouse.wheel.left', {x: 0, y: 0})
      t.render()
      // Scrolled 4 cols right — 'A' through 'D' off-screen
      expect(t.terminal.textAtRow(0)).not.toContain('A')
      expect(t.terminal.textAtRow(0)).toContain('E')

      // wheel.right scrolls back toward the start
      t.sendMouse('mouse.wheel.right', {x: 0, y: 0})
      t.render()
      // Scrolled back 2 cols
      expect(t.terminal.textAtRow(0)).toContain('C')
    })

    it('vertical wheel scrolls horizontally when content only overflows horizontally', () => {
      const wideText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      const t = testRender(
        makeWideScrollable(wideText, {showScrollbars: false}),
        {width: 10, height: 1},
      )
      expect(t.terminal.textAtRow(0)).toContain('A')

      // Wheel down should scroll horizontally (since content is not tooTall)
      t.sendMouse('mouse.wheel.down', {x: 0, y: 0})
      t.render()
      // scrollHeight=1, but it becomes deltaX when !tooTall
      expect(t.terminal.textAtRow(0)).not.toContain('A')
    })
  })

  // ─── scrollHeight / scrollWidth props ──────────────────────────────

  describe('scrollHeight and scrollWidth props', () => {
    it('scrollHeight controls vertical scroll amount', () => {
      const t = testRender(
        makeScrollable(20, {scrollHeight: 3, showScrollbars: false}),
        {width: 10, height: 5},
      )
      expect(t.terminal.textAtRow(0)).toContain('Line 0')

      t.sendMouse('mouse.wheel.down', {x: 0, y: 0})
      t.render()
      // Should have scrolled 3 lines instead of the default 1
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

      // wheel.left with scrollWidth=5 → scroll 5 cols
      t.sendMouse('mouse.wheel.left', {x: 0, y: 0})
      t.render()
      expect(t.terminal.textAtRow(0)).not.toContain('A')
      expect(t.terminal.textAtRow(0)).toContain('F')
    })
  })

  // ─── Ctrl+wheel fast scrolling ────────────────────────────────────

  describe('ctrl+wheel fast scrolling', () => {
    it('ctrl multiplies vertical scroll by 5', () => {
      const t = testRender(
        makeScrollable(30, {showScrollbars: false}),
        {width: 10, height: 5},
      )
      expect(t.terminal.textAtRow(0)).toContain('Line 0')

      t.sendMouse('mouse.wheel.down', {x: 0, y: 0}, {ctrl: true})
      t.render()
      // scrollHeight=1, ×5 = 5 lines
      expect(t.terminal.textAtRow(0)).toContain('Line 5')
    })

    it('ctrl multiplies horizontal scroll by 5', () => {
      const wideText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      const scrollable = new Scrollable({
        showScrollbars: false,
        children: [new Text({text: wideText})],
      })
      const t = testRender(scrollable, {width: 10, height: 1})

      // wheel.left with ctrl: scrollWidth=2 × 5 = 10 columns
      t.sendMouse('mouse.wheel.left', {x: 0, y: 0}, {ctrl: true})
      t.render()
      expect(t.terminal.textAtRow(0)).toContain('K') // 11th char
    })

    it('ctrl + custom scrollHeight stacks', () => {
      const t = testRender(
        makeScrollable(50, {scrollHeight: 2, showScrollbars: false}),
        {width: 10, height: 5},
      )

      t.sendMouse('mouse.wheel.down', {x: 0, y: 0}, {ctrl: true})
      t.render()
      // scrollHeight=2, ×5 = 10 lines
      expect(t.terminal.textAtRow(0)).toContain('Line 10')
    })
  })

  // ─── Mouse drag on scrollbar track ─────────────────────────────────

  describe('mouse click on scrollbar track', () => {
    it('clicking vertical scrollbar track jumps to that position', () => {
      const t = testRender(makeScrollable(20), {width: 10, height: 5})
      // Initially at top
      expect(t.terminal.textAtRow(0)).toContain('Line 0')

      // Click near the bottom of the vertical scrollbar (rightmost col, near bottom row)
      // scrollbar track is at x=9 (width-1), y from 0 to 4
      t.sendMouse('mouse.button.down', {x: 9, y: 3})
      t.render()
      // Should have jumped away from Line 0
      expect(t.terminal.textAtRow(0)).not.toContain('Line 0')
    })

    it('clicking horizontal scrollbar track jumps to that position', () => {
      const t = testRender(makeBothOverflow(), {width: 10, height: 5})
      // Horizontal scrollbar is on the bottom row (y=4), up to x=8 (leaving room for corner)
      const initialRow = t.terminal.textAtRow(0)

      // Click near the right end of the horizontal scrollbar
      t.sendMouse('mouse.button.down', {x: 6, y: 4})
      t.render()
      // Content should have scrolled horizontally
      expect(t.terminal.textAtRow(0)).not.toBe(initialRow)
    })

    it('mouse up releases scrollbar drag', () => {
      const t = testRender(makeScrollable(20), {width: 10, height: 5})

      // Start dragging the vertical scrollbar
      t.sendMouse('mouse.button.down', {x: 9, y: 2})
      t.render()
      const posAfterClick = t.terminal.textAtRow(0)

      // Release the mouse
      t.sendMouse('mouse.button.up', {x: 9, y: 2})
      t.render()

      // Now click somewhere in the content area — should NOT scroll
      t.sendMouse('mouse.button.down', {x: 3, y: 2})
      t.render()
      expect(t.terminal.textAtRow(0)).toBe(posAfterClick)
    })
  })

  // ─── naturalSize ──────────────────────────────────────────────────

  describe('naturalSize', () => {
    it('clamps to available size', () => {
      const scrollable = makeScrollable(20, {showScrollbars: false})
      const t = testRender(scrollable, {width: 10, height: 5})
      // The scrollable should not request more than the viewport
      // Verify it renders within bounds by checking content is visible
      expect(t.terminal.textAtRow(0)).toContain('Line 0')
      expect(t.terminal.textAtRow(4)).toContain('Line 4')
    })
  })

  // ─── scrollBy() public API ─────────────────────────────────────────

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

      // Scroll way past the end
      scrollable.scrollBy(0, 100)
      t.render()
      // Should show the last lines, not crash or go blank
      expect(t.terminal.textContent()).toContain('Line 9')

      // Scroll way past the start
      scrollable.scrollBy(0, -200)
      t.render()
      expect(t.terminal.textAtRow(0)).toContain('Line 0')
    })
  })

  // ─── update() prop changes ─────────────────────────────────────────

  describe('update (prop changes)', () => {
    it('can toggle showScrollbars via update', () => {
      const scrollable = makeScrollable(10, {showScrollbars: true})
      const t = testRender(scrollable, {width: 10, height: 5})

      // Initially has scrollbar
      let hasScrollbar = false
      for (let y = 0; y < 5; y++) {
        if (t.terminal.charAt(9, y) === '█') {
          hasScrollbar = true
          break
        }
      }
      expect(hasScrollbar).toBe(true)

      // Turn off scrollbars
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

  // ─── keepAtBottom ──────────────────────────────────────────────────

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
      t.render() // stabilize visibleSize

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

      // Click near the top of the vertical scrollbar (x=9) to scroll up
      t.sendMouse('mouse.button.down', {x: 9, y: 0})
      t.render()
      t.sendMouse('mouse.button.up', {x: 9, y: 0})
      t.render()

      // Now at the top — isAtBottom should be false
      const topLine = t.terminal.textAtRow(0)

      // Add content — should NOT auto-scroll since we're not at bottom
      stack.add(new Text({text: 'Line 20'}))
      t.render()

      expect(t.terminal.textAtRow(0)).toBe(topLine)
    })
  })
})
