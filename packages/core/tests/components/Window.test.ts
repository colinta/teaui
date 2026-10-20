import {describe, it, expect, vi} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Window} from '../../lib/components/Window.js'
import {Stack} from '../../lib/components/Stack.js'
import {Text} from '../../lib/components/Text.js'
import {Button} from '../../lib/components/Button.js'
import {Input} from '../../lib/components/Input.js'
import {Size} from '../../lib/geometry.js'

function click(t: ReturnType<typeof testRender>, x: number, y: number) {
  t.sendMouse('mouse.button.down', {x, y})
  t.sendMouse('mouse.button.up', {x, y})
}

function drag(
  t: ReturnType<typeof testRender>,
  from: {x: number; y: number},
  to: {x: number; y: number},
) {
  t.sendMouse('mouse.button.down', from)
  t.sendMouse('mouse.button.down', to)
  t.sendMouse('mouse.button.up', to)
}

describe('Window', () => {
  describe('rendering', () => {
    it('draws the title bar, buttons, and a double border', () => {
      const t = testRender(
        new Window({title: 'Editor', child: new Text('hello')}),
        {width: 26, height: 5},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
      expect(t.terminal.textAtRow(0)).toBe('╔╡x│ Editor ══════╡-╞═╡+╞╗')
    })

    it('underlines the title and the spaces around it', () => {
      const t = testRender(new Window({title: 'Editor'}), {
        width: 26,
        height: 3,
      })
      for (let x = 4; x < 12; x++) {
        expect(t.terminal.styleAt(x, 0).underline).toBe(true)
      }
      expect(t.terminal.styleAt(3, 0).underline).toBeFalsy()
      expect(t.terminal.styleAt(12, 0).underline).toBeFalsy()
    })

    it('draws without a title', () => {
      const t = testRender(new Window({}), {width: 16, height: 3})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it.each([
      ['no close', {showClose: false}],
      ['no minimize', {showMinimize: false}],
      ['no maximize', {showMaximize: false}],
      [
        'no buttons',
        {showClose: false, showMinimize: false, showMaximize: false},
      ],
    ])('hides buttons: %s', (_, props) => {
      const t = testRender(new Window({title: 'Tools', ...props}), {
        width: 24,
        height: 3,
      })
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('truncates the title with an ellipsis', () => {
      const t = testRender(
        new Window({title: 'A title that is much too long'}),
        {width: 24, height: 3},
      )
      expect(t.terminal.textAtRow(0)).toBe('╔╡x│ A title t… ╡-╞═╡+╞╗')
    })

    it('drops the button separator before shortening a title that fits', () => {
      const t = testRender(new Window({title: 'Right'}), {width: 18, height: 3})
      expect(t.terminal.textAtRow(0)).toBe('╔╡x│ Right ╡-╞╡+╞╗')
    })

    it('draws at its minimum width', () => {
      const window = new Window({title: 'A long title'})
      const {width} = window.minimumSize
      const t = testRender(window, {width, height: 3})
      expect(t.terminal.textAtRow(0)).toBe('╔╡x│ A l… ╡-╞╡+╞╗')
    })

    it('places title bar views between the title and the buttons', () => {
      const t = testRender(
        new Window({
          title: 'Notes',
          titleBar: [new Text('[a]'), new Text('[b]')],
          child: new Text('content'),
        }),
        {width: 30, height: 4},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
      expect(t.terminal.textAtRow(0)).toBe('╔╡x│ Notes ═════[a][b]╡-╞═╡+╞╗')
    })

    it('draws content inside the border', () => {
      const t = testRender(
        new Window({
          title: 'Content',
          child: Stack.down({children: [new Text('one'), new Text('two')]}),
        }),
        {width: 20, height: 5},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('draws inactive windows with a rounded single border', () => {
      const t = testRender(
        Stack.right({
          children: [
            new Window({title: 'First', width: 20, height: 4}),
            new Window({title: 'Second', width: 20, height: 4}),
          ],
        }),
        {width: 40, height: 4},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
      expect(t.terminal.charAt(0, 0)).toBe('╭')
      expect(t.terminal.charAt(20, 0)).toBe('╔')
    })

    it('draws a minimized window as its title bar, one row tall', () => {
      const t = testRender(
        new Window({title: 'Small', isMinimized: true, child: new Text('x')}),
        {width: 20, height: 6},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('buttons', () => {
    it('highlights a hovered button with double-line caps', () => {
      const t = testRender(new Window({title: 'Editor'}), {
        width: 26,
        height: 3,
      })
      t.sendMouse('mouse.move.in', {x: 2, y: 0})
      expect(t.terminal.textAt(0, 0, 4)).toBe('╔╣x║')
      // Palette.plain hover background, #616161
      expect(t.terminal.styleAt(2, 0).background).toEqual([0x61, 0x61, 0x61])
      expect(t.terminal.styleAt(5, 0).background).not.toEqual([
        0x61, 0x61, 0x61,
      ])

      t.sendMouse('mouse.move.in', {x: 19, y: 0})
      expect(t.terminal.textAtRow(0)).toBe('╔╡x│ Editor ══════╣-╠═╡+╞╗')
    })

    it('highlights hovered buttons on inactive windows with heavy caps', () => {
      const t = testRender(
        Stack.right({
          children: [
            new Window({title: 'First', width: 20, height: 3}),
            new Window({title: 'Second', width: 20, height: 3}),
          ],
        }),
        {width: 40, height: 3},
      )
      t.sendMouse('mouse.move.in', {x: 2, y: 0})
      expect(t.terminal.textAt(0, 0, 4)).toBe('╭┫x┃')
    })

    it('calls onClose', () => {
      const onClose = vi.fn()
      const t = testRender(new Window({title: 'Editor', onClose}), {
        width: 26,
        height: 3,
      })
      click(t, 2, 0)
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('removes itself without onClose', () => {
      const window = new Window({title: 'Editor'})
      const stack = Stack.down({children: [window]})
      const t = testRender(stack, {width: 26, height: 3})
      click(t, 2, 0)
      expect(stack.children).toEqual([])
      expect(t.terminal.textContent()).toBe('')
    })

    it('does not press a button when released elsewhere', () => {
      const onClose = vi.fn()
      const t = testRender(new Window({title: 'Editor', onClose}), {
        width: 26,
        height: 3,
      })
      drag(t, {x: 2, y: 0}, {x: 8, y: 0})
      expect(onClose).not.toHaveBeenCalled()
    })

    it('minimizes and restores', () => {
      const onMinimize = vi.fn()
      const window = new Window({title: 'Editor', onMinimize})
      const t = testRender(Stack.down({children: [window]}), {
        width: 26,
        height: 6,
      })
      click(t, 19, 0)
      expect(window.isMinimized).toBe(true)
      expect(onMinimize).toHaveBeenLastCalledWith(true)
      expect(t.terminal.textContent()).toMatchSnapshot()
      expect(window.naturalSize(new Size(26, 6)).height).toBe(1)

      // the restore button
      click(t, 23, 0)
      expect(window.isMinimized).toBe(false)
      expect(onMinimize).toHaveBeenLastCalledWith(false)
    })

    it('shows only the restore button when minimized', () => {
      const window = new Window({
        title: 'Editor',
        isMinimized: true,
        titleBar: [new Text('[a]')],
      })
      const t = testRender(Stack.down({children: [window]}), {
        width: 26,
        height: 3,
      })
      expect(t.terminal.textContent()).toBe('╭ Editor ─────────────┤↔├╮')
      expect(window.naturalTitleBarWidth).toBe(2 + 3 + 8)

      t.sendMouse('mouse.move.in', {x: 23, y: 0})
      expect(t.terminal.textAtRow(0)).toBe('╭ Editor ─────────────┫↔┣╮')
    })

    it.each([
      [
        'no buttons',
        {showClose: false, showMinimize: false, showMaximize: false},
      ],
      ['no minimize', {showMinimize: false}],
    ])('always shows the restore button: %s', (_, props) => {
      const onMinimize = vi.fn()
      const window = new Window({title: 'Editor', onMinimize})
      const t = testRender(Stack.down({children: [window]}), {
        width: 26,
        height: 3,
      })
      click(t, 19, 0)
      expect(window.isMinimized).toBe(true)

      // hiding the buttons doesn't restore the window, or hide 'restore'
      window.update({title: 'Editor', onMinimize, ...props})
      t.render()
      expect(window.isMinimized).toBe(true)
      expect(t.terminal.textAtRow(0)).toBe('╭ Editor ─────────────┤↔├╮')

      click(t, 23, 0)
      expect(window.isMinimized).toBe(false)
      expect(onMinimize).toHaveBeenLastCalledWith(false)
      expect(t.terminal.textAtRow(0)).not.toContain('↔')
    })

    it('maximizes and restores', () => {
      const onMaximize = vi.fn()
      const window = new Window({
        title: 'Editor',
        width: 20,
        height: 3,
        onMaximize,
      })
      const t = testRender(Stack.down({children: [window]}), {
        width: 26,
        height: 5,
      })
      click(t, 17, 0)
      expect(window.isMaximized).toBe(true)
      expect(onMaximize).toHaveBeenLastCalledWith(true)
      expect(t.terminal.textContent()).toMatchSnapshot()

      click(t, 23, 0)
      expect(window.isMaximized).toBe(false)
      expect(onMaximize).toHaveBeenLastCalledWith(false)
    })
  })

  describe('sizing', () => {
    it('has an absolute minimum width', () => {
      // 2 corners + 3 per button + 6 for a title
      expect(new Window({}).minimumSize).toEqual(new Size(11, 2))
      expect(new Window({title: 'x'}).minimumSize).toEqual(new Size(17, 2))
      expect(
        new Window({title: 'x', showClose: false, showMaximize: false})
          .minimumSize,
      ).toEqual(new Size(11, 2))
      expect(
        new Window({
          title: 'x',
          titleBar: [new Text('abcd')],
        }).minimumSize,
      ).toEqual(new Size(21, 2))
    })

    it('uses minWidth/minHeight when larger than the minimum', () => {
      expect(new Window({minWidth: 30, minHeight: 10}).minimumSize).toEqual(
        new Size(30, 10),
      )
      expect(new Window({minWidth: 3}).minimumSize).toEqual(new Size(11, 2))
    })

    it('restricts its size to min/max', () => {
      const available = new Size(80, 40)
      expect(new Window({width: 5, height: 1}).naturalSize(available)).toEqual(
        new Size(11, 2),
      )
      expect(
        new Window({
          width: 50,
          height: 30,
          maxWidth: 40,
          maxHeight: 20,
        }).naturalSize(available),
      ).toEqual(new Size(40, 20))
    })

    it('defaults to the size of its content', () => {
      const window = new Window({child: new Text('a long line of text\nb')})
      expect(window.naturalSize(new Size(80, 40))).toEqual(new Size(21, 4))
    })

    it('keeps its own size in a Stack that stretches it', () => {
      const t = testRender(
        Stack.right({
          children: [new Window({title: 'Win', width: 20, height: 4})],
        }),
        {width: 30, height: 8},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('resizing without a host', () => {
    it('resizes from the bottom-right corner', () => {
      const onResize = vi.fn()
      const window = new Window({title: 'Win', width: 20, height: 5, onResize})
      const t = testRender(Stack.down({children: [window]}), {
        width: 40,
        height: 10,
      })
      drag(t, {x: 19, y: 4}, {x: 24, y: 7})
      expect(window.width).toBe(25)
      expect(window.height).toBe(8)
      expect(onResize).toHaveBeenLastCalledWith(new Size(25, 8))
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('does not resize below the minimum size', () => {
      const window = new Window({title: 'Win', width: 20, height: 5})
      const t = testRender(Stack.down({children: [window]}), {
        width: 40,
        height: 10,
      })
      drag(t, {x: 19, y: 4}, {x: 0, y: 0})
      expect(window.width).toBe(window.minimumSize.width)
      expect(window.height).toBe(2)
    })

    it('cannot be resized from the left or top, or moved', () => {
      const onMove = vi.fn()
      const window = new Window({title: 'Win', width: 20, height: 5, onMove})
      const t = testRender(Stack.down({children: [window]}), {
        width: 40,
        height: 10,
      })
      drag(t, {x: 0, y: 2}, {x: 5, y: 2})
      drag(t, {x: 10, y: 0}, {x: 15, y: 3})
      expect(window.width).toBe(20)
      expect(window.height).toBe(5)
      expect(onMove).not.toHaveBeenCalled()
    })

    it('cannot be resized when resizable is false', () => {
      const window = new Window({width: 20, height: 5, resizable: false})
      const t = testRender(Stack.down({children: [window]}), {
        width: 40,
        height: 10,
      })
      drag(t, {x: 19, y: 4}, {x: 24, y: 7})
      expect(window.width).toBe(20)
    })
  })

  describe('props', () => {
    it('keeps user changes when re-rendered with the same props', () => {
      const window = new Window({title: 'Win', width: 20, height: 5})
      const t = testRender(Stack.down({children: [window]}), {
        width: 40,
        height: 10,
      })
      drag(t, {x: 19, y: 4}, {x: 24, y: 7})
      click(t, 18, 0)
      expect(window.isMinimized).toBe(true)

      window.update({title: 'Win', width: 20, height: 5})
      expect(window.width).toBe(25)
      expect(window.isMinimized).toBe(true)

      window.update({title: 'Win', width: 30, height: 5, isMinimized: false})
      expect(window.width).toBe(30)
      expect(window.height).toBe(8)
      expect(window.isMinimized).toBe(false)
    })

    it('keeps the title bar views when children are updated', () => {
      const window = new Window({
        title: 'Notes',
        titleBar: [new Text('[a]')],
        child: new Text('one'),
      })
      const t = testRender(window, {width: 30, height: 4})
      window.update({title: 'Notes', children: [new Text('two')]})
      t.render()
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('updates the title', () => {
      const window = new Window({title: 'One'})
      const t = testRender(window, {width: 20, height: 3})
      window.title = 'Two'
      t.render()
      expect(t.terminal.textAtRow(0)).toContain(' Two ')
    })
  })

  describe('activation', () => {
    function twoWindows(onActivate = vi.fn()) {
      const first = new Window({
        title: 'First',
        width: 20,
        height: 4,
        onActivate,
        child: new Button({title: 'ok'}),
      })
      const second = new Window({title: 'Second', width: 20, height: 4})
      const t = testRender(Stack.right({children: [first, second]}), {
        width: 40,
        height: 4,
      })
      return {first, second, t, onActivate}
    }

    it('the last window is active by default', () => {
      const {first, second} = twoWindows()
      expect(first.isActive).toBe(false)
      expect(second.isActive).toBe(true)
    })

    it('pressing the border activates a window', () => {
      const {first, second, t, onActivate} = twoWindows()
      click(t, 0, 2)
      expect(first.isActive).toBe(true)
      expect(second.isActive).toBe(false)
      expect(onActivate).toHaveBeenCalledOnce()
      expect(t.terminal.charAt(0, 0)).toBe('╔')
    })

    it('pressing a view inside the window activates it', () => {
      const {first, t} = twoWindows()
      const pos = t.terminal.find('ok')!
      click(t, pos.x, pos.y)
      expect(first.isActive).toBe(true)
    })

    it('minimized windows are not active', () => {
      const {first, second, t} = twoWindows()
      second.isMinimized = true
      t.render()
      expect(first.isActive).toBe(true)
      expect(second.isActive).toBe(false)

      first.isMinimized = true
      t.render()
      expect(first.isActive).toBe(false)
      expect(t.terminal.textContent()).not.toContain('╔')
    })

    it('focusing a view inside the window activates it', () => {
      const first = new Window({
        title: 'First',
        width: 20,
        height: 3,
        child: new Input({value: 'text'}),
      })
      const second = new Window({title: 'Second', width: 20, height: 3})
      testRender(Stack.right({children: [first, second]}), {
        width: 40,
        height: 3,
      })
      expect(first.isActive).toBe(true)
    })
  })
})
