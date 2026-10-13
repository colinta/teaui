import {afterEach, describe, expect, it, vi} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Screen} from '../../lib/Screen.js'
import {TestProgram} from '../../lib/TestProgram.js'
import {Stack} from '../../lib/components/Stack.js'
import {Scrollable} from '../../lib/components/Scrollable.js'
import {Input} from '../../lib/components/Input.js'
import {Text} from '../../lib/components/Text.js'
import {Button} from '../../lib/components/Button.js'
import {View} from '../../lib/View.js'
import {Viewport} from '../../lib/Viewport.js'
import {Point, Rect, Size} from '../../lib/geometry.js'

const screens: Screen[] = []
afterEach(() => {
  vi.restoreAllMocks()
  for (const screen of screens.splice(0)) {
    screen.stop()
  }
})

function render(view: View, width = 12, height = 4) {
  const t = testRender(view, {width, height})
  screens.push(view.screen!)
  t.render() // settle any initial geometry/focus invalidation
  return t
}

const lines = (count: number) =>
  Array.from({length: count}, (_, i) => new Text({text: `row ${i}`}))

describe('Stack cached layout', () => {
  it('replays geometry without measuring/laying out the whole tree on scroll', () => {
    const content = Stack.down(lines(100))
    const scroll = new Scrollable({children: [content], showScrollbars: false})
    const t = render(scroll)
    const origins = content.children.map(child => child.origin)
    const clips = vi.spyOn(Viewport.prototype, 'clipped')
    const placements = () =>
      clips.mock.calls
        .map(([rect]) => rect)
        .filter(rect => rect.origin.y > 0 && rect.size.height === 1)
    t.render()
    const before = placements()
    expect(before).toHaveLength(99)
    clips.mockClear()
    const rendered = vi.spyOn(Viewport.prototype, '_render')
    scroll.scrollBy(0, 1)
    t.render()
    const after = placements()
    expect(after).toHaveLength(before.length)
    after.forEach((rect, i) => expect(rect).toBe(before[i]))
    expect(content.children.map(child => child.origin)).toEqual(origins)
    expect(t.terminal.textAtRow(0)).toBe('row 1')
    expect(
      rendered.mock.calls.filter(([view]) => view instanceof Text),
    ).toHaveLength(100)
  })

  it('invalidates for descendant size/visibility, removal, insertion, reordering and gap changes', () => {
    const a = new Text({text: 'a'})
    const b = new Text({text: 'b'})
    const nested = Stack.down([a])
    const root = Stack.down([nested, b])
    const t = render(root, 12, 10)
    a.text = 'a\na2'
    t.render()
    expect(b.origin.y).toBe(2)
    nested.isVisible = false
    t.render()
    expect(b.origin.y).toBe(0)
    nested.isVisible = true
    root.gap = 1
    t.render()
    expect(b.origin.y).toBe(3)
    const c = new Text({text: 'c'})
    root.add(c, 0)
    t.render()
    expect(b.origin.y).toBe(5)
    root.removeChild(c)
    root.add(b, 0)
    t.render()
    expect(nested.origin.y).toBe(2)
    root.direction = 'up'
    t.render()
    expect(b.origin.y).toBe(9)
    expect(nested.origin.y).toBe(6)
  })

  it('invalidates when flex changes on an already-last child', () => {
    const a = new Text({text: 'a'})
    const b = new Text({text: 'b'})
    const root = Stack.right([
      ['flex1', a],
      ['flex1', b],
    ])
    const t = render(root, 12, 1)
    expect(b.origin.x).toBe(6)
    root.addFlex(2, b)
    t.render()
    expect(a.contentSize.width).toBe(4)
    expect(b.origin.x).toBe(4)
    b.flex = 1
    root.add(b)
    t.render()
    expect(b.origin.x).toBe(6)
  })

  it('applies pinned origins on each scroll and notices direct pin changes', () => {
    const header = new Text({text: 'Pinned', pin: 'horizontal'})
    const scroll = new Scrollable({
      showScrollbars: false,
      children: [new Text({text: 'a'.repeat(40)}), header],
    })
    const t = render(scroll)
    scroll.scrollTo({x: 20})
    t.render()
    t.render() // cached frame, not just the first frame at this offset
    expect(t.terminal.textAtRow(1)).toBe('Pinned')
    header.pin = undefined
    t.render()
    expect(t.terminal.textAtRow(1)).toBe('')
    header.pin = 'horizontal'
    t.render()
    expect(t.terminal.textAtRow(1)).toBe('Pinned')
  })

  it('recomputes wrapping and pinned width after a resize', () => {
    const header = new Text({
      text: 'aaa bbb ccc',
      wrap: true,
      pin: 'horizontal',
    })
    const scroll = new Scrollable({
      showScrollbars: false,
      children: [new Text({text: 'x'.repeat(40)}), header],
    })
    const program = new TestProgram({cols: 16, rows: 6})
    const screen = new Screen(program, scroll)
    screens.push(screen)
    screen.start()
    screen.render()
    expect(header.contentSize).toEqual(new Size(16, 1))
    program.terminal.cols = 8
    program.terminal.reset()
    program.sendResize()
    expect(header.contentSize).toEqual(new Size(8, 2))
    expect(program.terminal.textAtRow(1)).toBe('aaa bbb')
    expect(program.terminal.textAtRow(2)).toBe('ccc')
    program.terminal.cols = 16
    program.terminal.reset()
    program.sendResize()
    expect(header.contentSize).toEqual(new Size(16, 1))
  })

  it('still renders layout markers on cached frames at the correct gap positions', () => {
    const positions: Point[] = []
    class Marker extends View {
      get isLayoutMarker() {
        return true
      }
      naturalSize() {
        return Size.zero
      }
      render(viewport: Viewport) {
        positions.push(viewport.absoluteOrigin)
      }
    }
    const root = Stack.down({
      gap: 2,
      children: [new Text({text: 'a'}), new Marker(), new Text({text: 'b'})],
    })
    const t = render(root)
    positions.length = 0
    t.render()
    t.render()
    expect(positions).toEqual([new Point(0, 3), new Point(0, 3)])
  })

  it('does not reuse or commit probe layout', () => {
    let probing = false
    const child = new Text({text: 'aaa bbb ccc', wrap: true})
    const content = Stack.down([child])
    class ProbeHost extends Stack {
      render(viewport: Viewport) {
        if (probing) {
          viewport.clipped(new Rect([0, 0], [5, 8]), inside => {
            inside._probe(probe => content.render(probe))
          })
        }
        super.render(viewport)
      }
    }
    const root = new ProbeHost({children: [content]})
    const t = render(root, 16, 8)
    const before = t.terminal.textContent()
    probing = true
    t.render()
    expect(t.terminal.textContent()).toBe(before)
    expect(child.contentSize.height).toBe(1)
  })

  it('retains offscreen geometry and the existing nested focus order', () => {
    const first = new Input({value: 'first'})
    const second = new Input({value: 'second', multiline: true, wrap: true})
    let clicks = 0
    const save = new Button({
      title: 'Save',
      hotKey: 'C-s',
      onClick: () => clicks++,
    })
    const scroll = new Scrollable({
      showScrollbars: false,
      children: [Stack.down([first, ...lines(10), Stack.down([second, save])])],
    })
    const t = render(scroll)
    const secondOrigin = second.origin
    expect(second.contentSize.isEmpty).toBe(false)
    t.render()
    t.sendKey('tab')
    expect(second.hasFocus).toBe(true)
    expect(second.origin).toEqual(secondOrigin)
    t.sendKey('!') // Input scrolls to itself on editing
    expect(second.value).toBe('second!')
    expect(t.terminal.textContent()).toContain('second!')
    t.sendPaste('\nmore')
    expect(second.value).toBe('second!\nmore')
    // scrollTo deliberately leaves partially-visible targets in place. Reveal
    // the added line explicitly, rather than changing that existing behavior.
    scroll.scrollBy(0, 2)
    t.render()
    expect(t.terminal.textContent()).toContain('more')
    t.sendKey('s', {ctrl: true})
    expect(clicks).toBe(1)
    t.sendKey('tab', {shift: true})
    expect(first.hasFocus).toBe(true)
  })

  it('preserves mouse selection when a focused input scrolls out and back in', () => {
    const input = new Input({value: 'abcdef'})
    const scroll = new Scrollable({
      showScrollbars: false,
      children: [Stack.down([input, ...lines(20)])],
    })
    const t = render(scroll)
    t.sendMouse('mouse.button.down', {x: 1, y: 0})
    t.sendMouse('mouse.move.in', {x: 4, y: 0})
    t.sendMouse('mouse.button.up', {x: 4, y: 0})
    expect([input.minSelected(), input.maxSelected()]).toEqual([1, 4])
    scroll.scrollBy(0, 10)
    t.render()
    expect(input.hasFocus).toBe(true)
    expect(input.contentSize.isEmpty).toBe(false)
    expect([input.minSelected(), input.maxSelected()]).toEqual([1, 4])
    scroll.scrollTo(input)
    t.render()
    t.sendPaste('X')
    expect(input.value).toBe('aXef')
    t.sendMouse('mouse.button.down', {x: 2, y: 0})
    t.sendMouse('mouse.button.up', {x: 2, y: 0})
    t.tick(301)
    t.sendKey('!')
    expect(input.value).toBe('aX!ef')
  })

  it('keeps layout-only scrollTo reflow working for cached offscreen branches', () => {
    const target = new Text({text: 'X'})
    const group = Stack.down([
      ...lines(3),
      Stack.right([new Text({text: '0123456789'}), target]),
    ])
    const scroll = new Scrollable({
      showScrollbars: false,
      children: [...lines(10), group],
    })
    const t = render(scroll, 5, 3)
    scroll.scrollTo(target)
    t.render()
    expect(t.terminal.textAtRow(2)).toBe('6789X')
    scroll.scrollTo({x: 0, y: 0})
    t.render()
    expect(target.contentSize.isEmpty).toBe(true)
    scroll.scrollTo(target)
    t.render()
    expect(t.terminal.textAtRow(2)).toBe('6789X')
  })
})
