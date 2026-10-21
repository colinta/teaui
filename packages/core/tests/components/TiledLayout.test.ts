import {describe, it, expect, vi} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Window} from '../../lib/components/Window.js'
import {Desktop} from '../../lib/components/Desktop.js'
import {
  type DesktopLayout,
  TiledLayout,
} from '../../lib/components/DesktopLayout.js'
import {Text} from '../../lib/components/Text.js'
import {Input} from '../../lib/components/Input.js'
import {Point, Rect} from '../../lib/geometry.js'

type T = ReturnType<typeof testRender>

function click(t: T, {x, y}: {x: number; y: number}, shift = false) {
  t.sendMouse('mouse.button.down', {x, y}, {shift})
  t.sendMouse('mouse.button.up', {x, y}, {shift})
}

function tiled(count = 3, {width = 44, height = 14} = {}) {
  const windows = Array.from(
    {length: count},
    (_, index) =>
      new Window({
        title: `Win ${index + 1}`,
        child: new Text(`content ${index + 1}`),
      }),
  )
  const desktop = new Desktop({layout: 'tiled', children: windows})
  const t = testRender(desktop, {width, height})
  const layout = desktop.layout as TiledLayout
  const frame = (window: Window) => new Rect(window.origin, window.contentSize)
  return {windows, desktop, layout, t, frame}
}

const ALT = {alt: true}
const FOCUS = 'w'
const MOVE = 'm'
const SIZE = 'r'
const FULLSCREEN = 'z'
const FLOATING = 't'

/** Clicks the ⊞ button of the active window. */
function toggle(t: T) {
  const {x, y} = t.terminal.find('⊞')!
  click(t, {x, y})
}

/** Clicks the first cell of `text`. */
function press(t: T, text: string) {
  click(t, t.terminal.find(text)!)
}

describe('TiledLayout', () => {
  describe('controls', () => {
    it('adds a button to the bottom-left of the active window', () => {
      const {t, desktop} = tiled()
      expect(desktop.activeWindow?.title).toBe('Win 3')
      expect(t.terminal.textContent()).toMatchSnapshot()
      expect(t.terminal.find('╡⊞╞')).toEqual({x: 23, y: 13})
      expect(t.terminal.textContent().match(/⊞/g)).toHaveLength(1)
    })

    it('moves the controls when another window is activated', () => {
      const {t, windows} = tiled()
      windows[0].activate()
      t.render()
      expect(t.terminal.find('╡⊞╞')).toEqual({x: 1, y: 13})
      expect(windows[2].overlays).toEqual([])
      expect(windows[0].overlays).toHaveLength(1)
    })

    it('expands into the keys panel', () => {
      const {t, layout} = tiled(2)
      toggle(t)
      expect(layout.isExpanded).toBe(true)
      expect(layout.mode).toBeUndefined()
      expect(t.terminal.textContent()).toMatchSnapshot()
      expect(t.terminal.find('╭─keys───╮')).toEqual({x: 23, y: 6})
      expect(t.terminal.find('╣⊞╠')).toEqual({x: 23, y: 13})

      toggle(t)
      expect(layout.isExpanded).toBe(false)
      expect(t.terminal.textContent()).not.toContain('keys')
    })

    it.each([
      ['⌥w focus', FOCUS, '╭─focus╮'],
      ['⌥m move', MOVE, '╭─move─╮'],
      ['⌥r size', SIZE, '╭─size─╮'],
    ])('the %s keys open that mode in the panel', (row, key, title) => {
      const {t} = tiled(2)
      toggle(t)
      t.sendKey(key, ALT)
      expect(t.terminal.textContent()).toContain(title)
      expect(t.terminal.textContent()).not.toContain('keys')
      expect(t.terminal.textContent()).toMatchSnapshot()

      // esc closes the mode, then the panel
      t.sendKey('escape')
      expect(t.terminal.textContent()).toContain('╭─keys───╮')
      t.sendKey('escape')
      expect(t.terminal.textContent()).not.toContain('keys')

      // the rows of the keys panel can be pressed, too
      toggle(t)
      press(t, row)
      expect(t.terminal.textContent()).toContain(title)
    })

    it('the full and modal rows toggle fullscreen and floating', () => {
      const {t, windows, layout} = tiled(2)
      toggle(t)
      press(t, '⌥z full')
      expect(windows[1].isMaximized).toBe(true)
      press(t, '⌥t modal')
      expect(layout.isFloating(windows[1])).toBe(true)
    })

    it('moves windows with the arrow buttons', () => {
      const {t, frame, windows} = tiled(2)
      toggle(t)
      press(t, '⌥m move')
      press(t, '◀')
      expect(frame(windows[1]).origin).toEqual(Point.zero)
      expect(frame(windows[0]).origin).toEqual(new Point(22, 0))
      // h/j/k/l can be pressed
      press(t, 'l')
      expect(frame(windows[1]).origin).toEqual(new Point(22, 0))
    })

    it('esc in the panel closes the mode', () => {
      const {t, layout} = tiled(2)
      toggle(t)
      press(t, '⌥w focus')
      press(t, 'esc')
      expect(layout.mode).toBeUndefined()
      expect(t.terminal.textContent()).toContain('╭─keys───╮')
    })

    it('the (⇧) button makes the arrows shrink', () => {
      const {t, frame, windows} = tiled(2)
      toggle(t)
      press(t, '⌥r size')
      press(t, '◀')
      expect(frame(windows[1])).toEqual(new Rect([21, 0], [23, 14]))
      press(t, '(⇧)')
      press(t, '▶')
      expect(frame(windows[1])).toEqual(new Rect([22, 0], [22, 14]))
      // shift-click shrinks, too
      press(t, '(⇧)')
      click(t, t.terminal.find('▶')!, true)
      expect(frame(windows[1])).toEqual(new Rect([23, 0], [21, 14]))
    })

    it.each([
      ['focus', FOCUS],
      ['move', MOVE],
      ['size', SIZE],
    ] as const)('the %s key turns its mode off again', (mode, key) => {
      const {t, layout} = tiled(2)
      toggle(t)
      t.sendKey(key, ALT)
      expect(layout.mode).toBe(mode)
      t.sendKey(key, ALT)
      expect(layout.mode).toBeUndefined()
      // the panel stays open, showing the keys
      expect(t.terminal.textContent()).toContain('╭─keys───╮')
    })

    it('another mode key switches modes', () => {
      const {t, layout} = tiled()
      t.sendKey(FOCUS, ALT)
      t.sendKey(MOVE, ALT)
      expect(layout.mode).toBe('move')
    })

    it('enter turns the mode off', () => {
      const {t, layout, desktop} = tiled()
      t.sendKey(FOCUS, ALT)
      t.sendKey('k')
      expect(desktop.activeWindow?.title).toBe('Win 1')
      t.sendKey('return')
      expect(layout.mode).toBeUndefined()
    })

    it('enter is not captured without a mode', () => {
      const onKey = vi.fn()
      const input = new Input({value: ''})
      input.addKeyboardListener(onKey)
      const desktop = new Desktop({
        layout: 'tiled',
        children: [new Window({title: 'One', child: input})],
      })
      const t = testRender(desktop, {width: 30, height: 10})
      t.sendKey('return')
      expect(onKey).toHaveBeenCalledWith(
        expect.objectContaining({name: 'return'}),
        expect.anything(),
      )
    })

    it('modes from the keyboard do not open the panel', () => {
      const {t, layout} = tiled()
      t.sendKey(FOCUS, ALT)
      expect(layout.mode).toBe('focus')
      expect(layout.isExpanded).toBe(false)
      // the button is highlighted while a mode is active
      expect(t.terminal.find('╣⊞╠')).toEqual({x: 23, y: 13})
      expect(t.terminal.textContent()).not.toContain('focus')
      t.sendKey('escape')
      expect(layout.mode).toBeUndefined()
      expect(t.terminal.find('╡⊞╞')).toEqual({x: 23, y: 13})
    })

    it('does not show a panel that does not fit', () => {
      const {t, layout, desktop} = tiled(3)
      toggle(t)
      expect(layout.isExpanded).toBe(true)
      expect(t.terminal.textContent()).not.toContain('keys')
      // the keys still work
      t.sendKey(FOCUS, ALT)
      t.sendKey('h')
      expect(desktop.activeWindow?.title).toBe('Win 1')
    })

    it('removes the controls when the layout is replaced', () => {
      const {t, desktop, windows} = tiled()
      desktop.layout = 'floating'
      t.render()
      expect(windows.every(window => window.overlays.length === 0)).toBe(true)
      expect(t.terminal.textContent()).not.toContain('⊞')
    })

    it('escape is not captured without a mode or panel', () => {
      const input = new Input({value: ''})
      const onKey = vi.fn()
      input.addKeyboardListener(onKey)
      const desktop = new Desktop({
        layout: 'tiled',
        children: [new Window({title: 'One', child: input})],
      })
      const t = testRender(desktop, {width: 30, height: 10})
      t.sendKey('escape')
      expect(onKey).toHaveBeenCalledWith(
        expect.objectContaining({name: 'escape'}),
        expect.anything(),
      )
    })
  })

  describe('focus mode (⌥w)', () => {
    it('focuses the window in a direction', () => {
      const {t, desktop, layout} = tiled()
      t.sendKey(FOCUS, ALT)
      t.sendKey('up')
      expect(desktop.activeWindow?.title).toBe('Win 2')
      t.sendKey('left')
      expect(desktop.activeWindow?.title).toBe('Win 1')
      // nothing further left
      t.sendKey('left')
      expect(desktop.activeWindow?.title).toBe('Win 1')
      t.sendKey('right')
      expect(desktop.activeWindow?.title).toBe('Win 2')
      t.sendKey('down')
      expect(desktop.activeWindow?.title).toBe('Win 3')
      // the mode stays open, and moves with the active window
      expect(layout.mode).toBe('focus')
      expect(t.terminal.find('╣⊞╠')).toEqual({x: 23, y: 13})
    })

    it('leaves ⌥← and ⌥→ (⌥b and ⌥f in macOS terminals) to the Input', () => {
      const input = new Input({value: 'hello world'})
      const windows = [
        new Window({title: 'One'}),
        new Window({title: 'Two', child: input}),
      ]
      const desktop = new Desktop({layout: 'tiled', children: windows})
      const t = testRender(desktop, {width: 44, height: 10})
      const layout = desktop.layout as TiledLayout
      expect(input.hasFocus).toBe(true)
      t.sendKey('home')
      // ESC f, which Screen translates to ⌥→: word-right
      t.sendKey('f', ALT)
      t.sendKey('1')
      // ESC b, ⌥←: word-left
      t.sendKey('end')
      t.sendKey('b', ALT)
      t.sendKey('2')
      expect(input.value).toBe('hello1 2world')
      expect(layout.mode).toBeUndefined()
      expect(windows[1].isMaximized).toBe(false)
    })

    it('h/j/k/l focus the first/prev/next/last window', () => {
      const {t, desktop} = tiled()
      t.sendKey(FOCUS, ALT)
      t.sendKey('h')
      expect(desktop.activeWindow?.title).toBe('Win 1')
      t.sendKey('j')
      expect(desktop.activeWindow?.title).toBe('Win 3')
      t.sendKey('j')
      expect(desktop.activeWindow?.title).toBe('Win 2')
      t.sendKey('k')
      expect(desktop.activeWindow?.title).toBe('Win 3')
      t.sendKey('k')
      expect(desktop.activeWindow?.title).toBe('Win 1')
      t.sendKey('l')
      expect(desktop.activeWindow?.title).toBe('Win 3')
    })

    it('captures the mode keys, but not other keys', () => {
      const input = new Input({value: ''})
      const windows = [
        new Window({title: 'One'}),
        new Window({title: 'Two', child: input}),
      ]
      const desktop = new Desktop({layout: 'tiled', children: windows})
      const t = testRender(desktop, {width: 44, height: 10})
      expect(desktop.activeWindow).toBe(windows[1])
      t.sendKey('x')
      expect(input.value).toBe('x')

      t.sendKey(FOCUS, ALT)
      t.sendKey('h')
      expect(desktop.activeWindow).toBe(windows[0])
      // the input is in an inactive window now
      expect(input.hasFocus).toBe(false)
      t.sendKey('l')
      expect(desktop.activeWindow).toBe(windows[1])
      expect(input.value).toBe('x')

      // focus mode gave the input its focus back
      t.sendKey('escape')
      t.sendKey('l')
      expect(input.value).toBe('xl')
    })

    it('restores keyboard focus in the window', () => {
      const first = new Input({value: ''})
      const second = new Input({value: ''})
      const windows = [
        new Window({title: 'One', child: first}),
        new Window({title: 'Two', child: second}),
      ]
      const desktop = new Desktop({layout: 'tiled', children: windows})
      const t = testRender(desktop, {width: 44, height: 10})
      // the second window is active, and its input has focus
      expect(second.hasFocus).toBe(true)
      // focus the first input (by clicking it), then go back to the second
      // window with the keyboard
      click(t, {x: 5, y: 1})
      expect(first.hasFocus).toBe(true)
      t.sendKey(FOCUS, ALT)
      t.sendKey('l')
      t.sendKey('escape')
      t.sendKey('a')
      expect(first.value).toBe('')
      expect(second.value).toBe('a')
    })
  })

  describe('move mode (⌥m)', () => {
    it('moves the active window to the window in a direction', () => {
      const {t, desktop, frame, windows} = tiled()
      t.sendKey(MOVE, ALT)
      t.sendKey('left')
      expect(desktop.activeWindow).toBe(windows[2])
      expect(frame(windows[2]).origin).toEqual(Point.zero)
      expect(frame(windows[0]).origin).toEqual(new Point(22, 7))
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('h/j/k/l move to the first/prev/next/last window', () => {
      const {t, frame, windows} = tiled()
      t.sendKey(MOVE, ALT)
      t.sendKey('j')
      // win 3 and win 2 swapped
      expect(frame(windows[2]).origin).toEqual(new Point(22, 0))
      t.sendKey('h')
      expect(frame(windows[2]).origin).toEqual(Point.zero)
      t.sendKey('l')
      expect(frame(windows[2]).origin).toEqual(new Point(22, 7))
    })

    it('does not change the Desktop children', () => {
      const {t, desktop, windows} = tiled()
      t.sendKey(MOVE, ALT)
      t.sendKey('h')
      expect(desktop.children).toEqual(windows)
    })
  })

  describe('size mode (⌥r)', () => {
    it('arrows grow the window on that side', () => {
      const {t, frame, windows} = tiled()
      windows[1].activate()
      t.render()
      t.sendKey(SIZE, ALT)
      // down: height += 1 (grow bottom)
      t.sendKey('down')
      expect(frame(windows[1])).toEqual(new Rect([22, 0], [22, 8]))
      expect(frame(windows[2])).toEqual(new Rect([22, 8], [22, 6]))
      // left: width += 1, x -= 1 (grow left)
      t.sendKey('left')
      expect(frame(windows[1])).toEqual(new Rect([21, 0], [23, 8]))
      expect(frame(windows[0]).size.width).toBe(21)
    })

    it('shift+arrows shrink the window from the other side', () => {
      const {t, frame, windows} = tiled()
      windows[1].activate()
      t.render()
      t.sendKey(SIZE, ALT)
      // ⇧up: height -= 1 (shrink bottom)
      t.sendKey('up', {shift: true})
      expect(frame(windows[1])).toEqual(new Rect([22, 0], [22, 6]))
      // ⇧right: width -= 1 (shrink left)
      t.sendKey('right', {shift: true})
      expect(frame(windows[1])).toEqual(new Rect([23, 0], [21, 6]))
    })

    it('has no effect on edges along the desktop border', () => {
      const {t, frame, windows} = tiled()
      windows[1].activate()
      t.render()
      const before = frame(windows[1])
      t.sendKey(SIZE, ALT)
      // grow top, grow right
      t.sendKey('up')
      t.sendKey('right')
      // shrink top (⇧down) is fine... but the top edge is on the border
      t.sendKey('down', {shift: true})
      t.sendKey('left', {shift: true})
      expect(frame(windows[1])).toEqual(before)
    })

    it('has no effect beyond the minimum size', () => {
      const {t, frame, windows} = tiled(2, {width: 44, height: 6})
      windows[1].activate()
      t.render()
      t.sendKey(SIZE, ALT)
      for (let index = 0; index < 30; index++) {
        t.sendKey('right', {shift: true})
      }
      expect(frame(windows[1]).size.width).toBe(windows[1].minimumSize.width)
      for (let index = 0; index < 30; index++) {
        t.sendKey('left')
      }
      expect(frame(windows[0]).size.width).toBe(windows[0].minimumSize.width)
    })
  })

  describe('⌥z fullscreen', () => {
    it('toggles the active window fullscreen', () => {
      const onMaximize = vi.fn()
      const {t, windows} = tiled()
      windows[2].update({title: 'Win 3', onMaximize})
      t.sendKey(FULLSCREEN, ALT)
      expect(windows[2].isMaximized).toBe(true)
      expect(onMaximize).toHaveBeenLastCalledWith(true)
      expect(t.terminal.textContent()).toMatchSnapshot()

      t.sendKey(FULLSCREEN, ALT)
      expect(windows[2].isMaximized).toBe(false)
    })

    it('fullscreen windows are drawn above floating windows', () => {
      const {t, windows, layout} = tiled()
      layout.setFloating(windows[2], true)
      windows[0].isMaximized = true
      windows[0].activate()
      t.render()
      expect(t.terminal.textContent()).not.toContain('Win 3')
    })
  })

  describe('⌥t modal (floating)', () => {
    it('floats the active window above the tiles, and back', () => {
      const {t, windows, layout, frame} = tiled()
      t.sendKey(FLOATING, ALT)
      expect(layout.isFloating(windows[2])).toBe(true)
      expect(t.terminal.textContent()).toMatchSnapshot()
      // the other windows are tiled without it
      expect(frame(windows[1])).toEqual(new Rect([22, 0], [22, 14]))

      t.sendKey(FLOATING, ALT)
      expect(layout.isFloating(windows[2])).toBe(false)
      expect(frame(windows[2])).toEqual(new Rect([22, 7], [22, 7]))
    })

    it('floating windows stay above the tiles', () => {
      const {t, windows, layout} = tiled()
      layout.setFloating(windows[2], true)
      windows[0].activate()
      t.render()
      expect(t.terminal.textContent()).toContain('╭┤x│ Win 3')
      const row = t.terminal.find('Win 3')!.y
      expect(row).toBeGreaterThan(0)
    })

    it('floating windows can be moved and resized', () => {
      const onMove = vi.fn()
      const {t, windows, frame} = tiled()
      windows[2].update({title: 'Win 3', onMove})
      t.sendKey(FLOATING, ALT)
      const before = frame(windows[2])
      t.sendMouse('mouse.button.down', {
        x: before.minX() + 12,
        y: before.minY(),
      })
      t.sendMouse('mouse.button.down', {
        x: before.minX() + 10,
        y: before.minY() + 1,
      })
      t.sendMouse('mouse.button.up', {
        x: before.minX() + 10,
        y: before.minY() + 1,
      })
      expect(frame(windows[2]).origin).toEqual(before.origin.offset(-2, 1))
      expect(onMove).toHaveBeenCalled()

      t.sendKey(SIZE, ALT)
      t.sendKey('right')
      expect(frame(windows[2]).size.width).toBe(before.size.width + 1)
    })

    it('move mode only moves tiles', () => {
      const {t, windows, layout, frame} = tiled()
      layout.setFloating(windows[2], true)
      t.render()
      const before = frame(windows[2])
      t.sendKey(MOVE, ALT)
      t.sendKey('h')
      expect(frame(windows[2])).toEqual(before)
    })
  })

  describe('the mouse', () => {
    it('resizes the edges between the stacked windows', () => {
      const {t, windows, frame} = tiled()
      t.sendMouse('mouse.button.down', {x: 30, y: 6})
      t.sendMouse('mouse.button.down', {x: 30, y: 9})
      t.sendMouse('mouse.button.up', {x: 30, y: 9})
      expect(frame(windows[1]).size.height).toBe(10)
      expect(frame(windows[2])).toEqual(new Rect([22, 10], [22, 4]))
    })
  })
})

describe('Desktop layout hooks', () => {
  it('calls focus and blur when the active window changes', () => {
    const calls: string[] = []
    const layout: DesktopLayout = {
      layout: (windows, size) => windows.map(() => new Rect(Point.zero, size)),
      focus: window => calls.push(`focus ${window.title}`),
      blur: window => calls.push(`blur ${window.title}`),
    }
    const windows = [new Window({title: 'A'}), new Window({title: 'B'})]
    const desktop = new Desktop({layout, children: windows})
    const t = testRender(desktop, {width: 30, height: 5})
    expect(calls).toEqual(['focus B'])
    windows[0].activate()
    t.render()
    expect(calls).toEqual(['focus B', 'blur B', 'focus A'])
    windows[0].isMinimized = true
    windows[1].isMinimized = true
    t.render()
    expect(calls.at(-1)).toBe('blur A')
  })

  it('draws windows by layer, then z-order', () => {
    const layout: DesktopLayout = {
      layout: (windows, size) => windows.map(() => new Rect(Point.zero, size)),
      layer: window => (window.title === 'Top' ? 1 : 0),
    }
    const windows = [new Window({title: 'Top'}), new Window({title: 'Bottom'})]
    const t = testRender(new Desktop({layout, children: windows}), {
      width: 30,
      height: 5,
    })
    expect(t.terminal.textAtRow(0)).toContain('Top')
  })
})
