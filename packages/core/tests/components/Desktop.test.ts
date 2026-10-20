import {describe, it, expect, vi} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Window} from '../../lib/components/Window.js'
import {Desktop} from '../../lib/components/Desktop.js'
import {
  type DesktopLayout,
  FloatingLayout,
  TiledLayout,
} from '../../lib/components/DesktopLayout.js'
import {Text} from '../../lib/components/Text.js'
import {Button} from '../../lib/components/Button.js'
import {Point, Rect, Size} from '../../lib/geometry.js'

type T = ReturnType<typeof testRender>

function click(t: T, x: number, y: number) {
  t.sendMouse('mouse.button.down', {x, y})
  t.sendMouse('mouse.button.up', {x, y})
}

function drag(t: T, from: {x: number; y: number}, to: {x: number; y: number}) {
  t.sendMouse('mouse.button.down', from)
  t.sendMouse('mouse.button.down', to)
  t.sendMouse('mouse.button.up', to)
}

function floating() {
  const editor = new Window({
    title: 'Editor',
    x: 1,
    y: 1,
    width: 24,
    height: 6,
    child: new Text('editor'),
  })
  const tools = new Window({
    title: 'Tools',
    x: 10,
    y: 4,
    width: 24,
    height: 6,
    child: new Text('tools'),
  })
  const desktop = new Desktop({children: [editor, tools]})
  const t = testRender(desktop, {width: 40, height: 12})
  return {editor, tools, desktop, t}
}

describe('Desktop', () => {
  describe('floating layout', () => {
    it('draws windows at their positions, in z-order', () => {
      const {t, desktop, tools} = floating()
      expect(t.terminal.textContent()).toMatchSnapshot()
      expect(desktop.activeWindow).toBe(tools)
    })

    it('cascades windows without a position', () => {
      const t = testRender(
        new Desktop({
          children: [
            new Window({title: 'One', width: 20, height: 4}),
            new Window({title: 'Two', width: 20, height: 4}),
            new Window({title: 'Three', width: 20, height: 4}),
          ],
        }),
        {width: 30, height: 8},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('keeps windows inside the desktop', () => {
      const t = testRender(
        new Desktop({
          child: new Window({title: 'Off', x: 50, y: 50, width: 20, height: 4}),
        }),
        {width: 30, height: 8},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('raises a window when it is pressed', () => {
      const {t, desktop, editor} = floating()
      click(t, 1, 3)
      expect(desktop.activeWindow).toBe(editor)
      expect(desktop.windows).toEqual([desktop.children[1], editor])
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('raises a window when a view inside it is pressed', () => {
      const onClick = vi.fn()
      const editor = new Window({
        title: 'Editor',
        x: 0,
        y: 0,
        width: 20,
        height: 5,
        child: new Button({title: 'ok', onClick}),
      })
      const tools = new Window({
        title: 'Tools',
        x: 10,
        y: 3,
        width: 20,
        height: 5,
      })
      const desktop = new Desktop({children: [editor, tools]})
      const t = testRender(desktop, {width: 30, height: 8})
      const pos = t.terminal.find('ok')!
      click(t, pos.x, pos.y)
      expect(onClick).toHaveBeenCalledOnce()
      expect(desktop.activeWindow).toBe(editor)
    })

    it('only the top window receives the mouse where windows overlap', () => {
      const onClick = vi.fn()
      const editor = new Window({
        x: 0,
        y: 0,
        width: 20,
        height: 5,
        child: new Button({title: 'ok', onClick}),
      })
      const tools = new Window({x: 0, y: 0, width: 20, height: 5})
      const desktop = new Desktop({children: [editor, tools]})
      const t = testRender(desktop, {width: 30, height: 8})
      // the button is hidden behind 'tools'
      click(t, 9, 2)
      expect(onClick).not.toHaveBeenCalled()
      expect(desktop.activeWindow).toBe(tools)
    })

    it('moves a window by dragging the title bar', () => {
      const onMove = vi.fn()
      const window = new Window({
        title: 'Drag',
        x: 2,
        y: 1,
        width: 20,
        height: 4,
        onMove,
      })
      const t = testRender(new Desktop({child: window}), {
        width: 40,
        height: 12,
      })
      drag(t, {x: 10, y: 1}, {x: 15, y: 4})
      expect(window.position).toEqual(new Point(7, 4))
      expect(onMove).toHaveBeenLastCalledWith(new Point(7, 4))
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('does not move a window beyond the desktop', () => {
      const window = new Window({x: 2, y: 1, width: 20, height: 4})
      const t = testRender(new Desktop({child: window}), {
        width: 40,
        height: 12,
      })
      drag(t, {x: 10, y: 1}, {x: 60, y: 30})
      expect(window.position).toEqual(new Point(20, 8))
    })

    it('does not move a window that is not movable', () => {
      const window = new Window({
        x: 2,
        y: 1,
        width: 20,
        height: 4,
        movable: false,
      })
      const t = testRender(new Desktop({child: window}), {
        width: 40,
        height: 12,
      })
      drag(t, {x: 10, y: 1}, {x: 15, y: 4})
      expect(window.position).toEqual(new Point(2, 1))
    })

    it('resizes from the left edge, keeping the right edge in place', () => {
      const onMove = vi.fn()
      const onResize = vi.fn()
      const window = new Window({
        title: 'Resize',
        x: 10,
        y: 2,
        width: 20,
        height: 5,
        onMove,
        onResize,
      })
      const t = testRender(new Desktop({child: window}), {
        width: 40,
        height: 12,
      })
      drag(t, {x: 10, y: 4}, {x: 6, y: 4})
      expect(window.position).toEqual(new Point(6, 2))
      expect(window.width).toBe(24)
      expect(onMove).toHaveBeenLastCalledWith(new Point(6, 2))
      expect(onResize).toHaveBeenLastCalledWith(new Size(24, 5))
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('resizes from the top-right corner', () => {
      const window = new Window({x: 10, y: 4, width: 20, height: 5})
      const t = testRender(new Desktop({child: window}), {
        width: 40,
        height: 12,
      })
      drag(t, {x: 29, y: 4}, {x: 32, y: 2})
      expect(window.position).toEqual(new Point(10, 2))
      expect(window.width).toBe(23)
      expect(window.height).toBe(7)
    })

    it('does not resize beyond the desktop', () => {
      const window = new Window({x: 10, y: 4, width: 20, height: 5})
      const t = testRender(new Desktop({child: window}), {
        width: 40,
        height: 12,
      })
      drag(t, {x: 29, y: 8}, {x: 60, y: 30})
      expect(window.width).toBe(30)
      expect(window.height).toBe(8)
    })

    it('moves minimized windows to the bottom, one row tall', () => {
      const {t, desktop, editor, tools} = floating()
      // tools' minimize button
      click(t, 10 + 16, 4)
      expect(tools.isMinimized).toBe(true)
      expect(desktop.activeWindow).toBe(editor)
      expect(t.terminal.textContent()).toMatchSnapshot()
      expect(t.terminal.textAtRow(11)).toBe('╭ Tools ┤↔├╮')
    })

    it('restores a minimized window to where it was', () => {
      const {t, tools} = floating()
      click(t, 10 + 16, 4)
      // the restore button, in the bottom row
      click(t, 9, 11)
      expect(tools.isMinimized).toBe(false)
      expect(tools.position).toEqual(new Point(10, 4))
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('keeps windows above the minimized windows', () => {
      const {t, editor, tools} = floating()
      tools.position = new Point(10, 6)
      editor.isMinimized = true
      t.render()
      // tools is 6 rows tall: it no longer fits at y=6, above the bottom row
      expect(t.terminal.textAtRow(5)).toContain('╔╡x│ Tools')
      expect(t.terminal.textAtRow(11)).toBe('╭ Editor ┤↔├╮')
      // ...but it remembers where it was
      expect(tools.position).toEqual(new Point(10, 6))
    })

    it('has no active window when every window is minimized', () => {
      const {t, desktop, editor, tools} = floating()
      editor.isMinimized = true
      tools.isMinimized = true
      t.render()
      expect(desktop.activeWindow).toBeUndefined()
      expect(t.terminal.textContent()).not.toContain('╔')
    })

    it('maximizes a window to fill the desktop', () => {
      const {t, tools} = floating()
      click(t, 10 + 20, 4)
      expect(tools.isMaximized).toBe(true)
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('closes a window', () => {
      const {t, desktop, editor, tools} = floating()
      click(t, 11, 4)
      expect(desktop.children).toEqual([editor])
      expect(desktop.windows).toEqual([editor])
      expect(desktop.activeWindow).toBe(editor)
      expect(tools.parent).toBeUndefined()
    })

    it('draws children that are not windows behind the windows', () => {
      const t = testRender(
        new Desktop({
          children: [
            new Text('.'.repeat(30) + '\n' + '.'.repeat(30)),
            new Window({x: 2, y: 0, width: 20, height: 3}),
          ],
        }),
        {width: 30, height: 3},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('tiled layout', () => {
    function tiled(count: number) {
      const windows = Array.from(
        {length: count},
        (_, index) =>
          new Window({
            title: `Win ${index + 1}`,
            child: new Text(`content ${index + 1}`),
          }),
      )
      const desktop = new Desktop({layout: 'tiled', children: windows})
      const t = testRender(desktop, {width: 40, height: 12})
      return {windows, desktop, t}
    }

    it('fills the desktop with a single window', () => {
      const {t} = tiled(1)
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('places the first window on the left, the rest stacked on the right', () => {
      const {t} = tiled(3)
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('lines up minimized windows along the bottom', () => {
      const {t, windows} = tiled(3)
      windows[1].isMinimized = true
      windows[2].isMinimized = true
      t.render()
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('tiles the windows that are not minimized', () => {
      const {t, windows} = tiled(3)
      windows[0].isMinimized = true
      t.render()
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('covers the tiles with a maximized window', () => {
      const {t, windows} = tiled(3)
      windows[1].isMaximized = true
      windows[1].activate()
      t.render()
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('changes the ratio by dragging the border between the tiles', () => {
      const {t, desktop} = tiled(2)
      drag(t, {x: 19, y: 5}, {x: 21, y: 5})
      expect((desktop.layout as TiledLayout).ratio).toBe(0.55)
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('keeps the minimum width of the windows when changing the ratio', () => {
      const {t, desktop, windows} = tiled(2)
      drag(t, {x: 19, y: 5}, {x: 35, y: 5})
      const ratio = (desktop.layout as TiledLayout).ratio
      expect(ratio * 40).toBe(40 - windows[1].minimumSize.width)
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('does not move windows', () => {
      const {t, windows} = tiled(2)
      drag(t, {x: 10, y: 0}, {x: 15, y: 5})
      expect(windows[0].position).toBeUndefined()
    })

    it('accepts layout options', () => {
      const desktop = new Desktop({
        layout: new TiledLayout({ratio: 0.25}),
        children: [new Window({}), new Window({})],
      })
      const t = testRender(desktop, {width: 40, height: 4})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('minimized windows', () => {
    function minimized(layout: 'floating' | 'tiled') {
      const windows = ['One', 'Two', 'Three'].map(
        (title, index) =>
          new Window({
            title,
            x: index * 4,
            y: index * 2,
            width: 20,
            height: 5,
          }),
      )
      const desktop = new Desktop({layout, children: windows})
      const t = testRender(desktop, {width: 40, height: 12})
      return {windows, desktop, t}
    }

    it.each(['floating', 'tiled'] as const)(
      '%s: are arranged in the order they were minimized',
      layout => {
        const {t, windows} = minimized(layout)
        windows[2].isMinimized = true
        t.render()
        windows[0].isMinimized = true
        t.render()
        expect(t.terminal.textAtRow(11)).toBe('╭ Three ┤↔├╮╭ One ┤↔├╮')

        // raising a minimized window doesn't rearrange them
        windows[2].activate()
        t.render()
        expect(t.terminal.textAtRow(11)).toBe('╭ Three ┤↔├╮╭ One ┤↔├╮')
      },
    )

    it.each(['floating', 'tiled'] as const)(
      '%s: cannot be dragged or resized',
      layout => {
        const onMove = vi.fn()
        const onResize = vi.fn()
        const {t, windows} = minimized(layout)
        windows[0].update({
          title: 'One',
          x: 0,
          y: 0,
          width: 20,
          height: 5,
          isMinimized: true,
          onMove,
          onResize,
        })
        t.render()
        const before = t.terminal.textAtRow(11)
        expect(before).toBe('╭ One ┤↔├╮')

        // the title, and both corners
        drag(t, {x: 3, y: 11}, {x: 20, y: 3})
        drag(t, {x: 0, y: 11}, {x: 5, y: 6})
        drag(t, {x: 9, y: 11}, {x: 30, y: 5})
        expect(onMove).not.toHaveBeenCalled()
        expect(onResize).not.toHaveBeenCalled()
        expect(windows[0].isMinimized).toBe(true)
        expect(windows[0].position).toEqual(new Point(0, 0))
        expect(windows[0].width).toBe(20)
        expect(t.terminal.textAtRow(11)).toBe(before)
      },
    )

    it('wrap onto more rows when they do not fit', () => {
      const {t, windows, desktop} = minimized('floating')
      for (const window of windows) {
        window.isMinimized = true
      }
      // 'Four' doesn't fit on the first row (40 columns)
      desktop.add(new Window({title: 'Four', isMinimized: true}))
      t.render()
      expect(t.terminal.textContent()).toMatchSnapshot()
      expect(t.terminal.textAtRow(10)).toBe('╭ One ┤↔├╮╭ Two ┤↔├╮╭ Three ┤↔├╮')
      expect(t.terminal.textAtRow(11)).toBe('╭ Four ┤↔├╮')
    })

    it('are not passed to the layout', () => {
      const layout = vi.fn((windows: readonly Window[], size: Size) =>
        windows.map(() => new Rect(Point.zero, size)),
      )
      const windows = [
        new Window({title: 'Open'}),
        new Window({title: 'Minimized', isMinimized: true}),
      ]
      testRender(new Desktop({layout: {layout}, children: windows}), {
        width: 30,
        height: 6,
      })
      expect(layout).toHaveBeenLastCalledWith([windows[0]], new Size(30, 5))
    })
  })

  describe('layout prop', () => {
    it('is only replaced when it changes', () => {
      const desktop = new Desktop({layout: 'tiled'})
      const layout = desktop.layout
      desktop.update({layout: 'tiled'})
      expect(desktop.layout).toBe(layout)
      desktop.update({layout: 'floating'})
      expect(desktop.layout).toBeInstanceOf(FloatingLayout)
      desktop.update({})
      expect(desktop.layout).toBeInstanceOf(FloatingLayout)
    })

    it('supports custom layouts', () => {
      const custom: DesktopLayout = {
        layout(windows, size) {
          const width = Math.floor(size.width / windows.length)
          return windows.map(
            (_, index) => new Rect([index * width, 0], [width, size.height]),
          )
        },
      }
      const windows = [
        new Window({title: 'A', showMinimize: false, showMaximize: false}),
        new Window({title: 'B', showMinimize: false, showMaximize: false}),
      ]
      const desktop = new Desktop({layout: custom, children: windows})
      const t = testRender(desktop, {width: 30, height: 4})
      expect(t.terminal.textContent()).toMatchSnapshot()

      // without canMove/canResize, windows stay put
      drag(t, {x: 8, y: 0}, {x: 12, y: 2})
      drag(t, {x: 14, y: 2}, {x: 20, y: 2})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('hides windows that the layout has no frame for', () => {
      const custom: DesktopLayout = {
        layout: windows =>
          windows.map((_, index) =>
            index === 0 ? new Rect([0, 0], [20, 3]) : undefined,
          ),
      }
      const desktop = new Desktop({
        layout: custom,
        children: [new Window({title: 'Shown'}), new Window({title: 'Hidden'})],
      })
      const t = testRender(desktop, {width: 30, height: 4})
      expect(t.terminal.textContent()).toContain('Shown')
      expect(t.terminal.textContent()).not.toContain('Hidden')
    })
  })
})
