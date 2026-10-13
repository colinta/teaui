import {afterEach, describe, expect, it} from 'vitest'
import {View, type Props} from '../lib/View.js'
import {Viewport} from '../lib/Viewport.js'
import {Rect, Point, Size} from '../lib/geometry.js'
import {testRender} from '../lib/TestScreen.js'
import type {Screen} from '../lib/Screen.js'
import {Stack} from '../lib/components/Stack.js'
import {Text} from '../lib/components/Text.js'

class GeometryView extends View {
  preferred = new Size(8, 3)
  last?: {size: Size; origin: Point; location: Point}
  calls = 0
  dirtyDuringMeasure = false

  naturalSize() {
    if (this.dirtyDuringMeasure) {
      this.invalidateSize()
    }
    return this.preferred
  }

  render(viewport: Viewport) {
    this.calls++
    this.last = {
      size: viewport.contentSize,
      origin: viewport.absoluteOrigin,
      location: viewport.location,
    }
    viewport.write('x', Point.zero)
  }
}

const screens: Screen[] = []
afterEach(() => {
  for (const screen of screens.splice(0)) {
    screen.stop()
  }
})

function setup(props: Props = {}) {
  const view = new GeometryView(props)
  const t = testRender(view, {width: 24, height: 10})
  screens.push(view.screen!)
  return {view, t}
}

describe('View cached render geometry', () => {
  it.each<Props>([
    {},
    {x: 2, y: 1, padding: 1},
    {width: 'natural', height: 'natural', padding: 1},
    {width: 'fill', height: 'shrink', paddingLeft: 3},
    {minWidth: 30, maxHeight: 5},
    {width: 12, height: 6, padding: 2},
    {x: 30, y: 20},
    {width: 0, height: 0},
  ])('reuses geometry without skipping render/listeners: %j', props => {
    const {view, t} = setup(props)
    const before = view.last
    const content = view.contentSize
    const frame = view.screen!.snapshot()
    const calls = view.calls
    let keys = 0
    view.addKeyboardListener(() => keys++, {events: ['ctrl+k']})
    t.render()
    expect(view.contentSize).toBe(content)
    expect(view.calls).toBe(calls + 1)
    expect(view.last).toEqual(before)
    expect(view.contentSize).toEqual(content)
    expect(view.screen!.snapshot()).toBe(frame)
    t.sendKey('k', {ctrl: true})
    expect(keys).toBe(1)
    view.invalidateSize()
    t.render()
    expect(view.last).toEqual(before)
  })

  it('invalidates for content, props, allocation size and direct padding changes', () => {
    const {view, t} = setup({width: 'natural', height: 'natural'})
    view.preferred = new Size(12, 4)
    view.invalidateSize()
    t.render()
    expect(view.contentSize).toEqual(new Size(12, 4))
    view.update({padding: 1})
    t.render()
    expect(view.contentSize).toEqual(new Size(22, 8))
    view.padding!.left = 4
    t.render()
    expect(view.contentSize).toEqual(new Size(19, 8))
    expect(view.last!.origin).toEqual(new Point(4, 1))
    view.padding = {top: 0, right: 0, bottom: 0, left: 2}
    t.render()
    expect(view.last!.origin).toEqual(new Point(2, 0))
    view.render(Viewport.layout(view.screen!, new Size(12, 5)))
    expect(view.contentSize).toEqual(new Size(10, 5))
    t.render()
    expect(view.contentSize).toEqual(new Size(22, 10))
  })

  it('updates location and mouse coordinates when a cached allocation moves', () => {
    const prefix = new Text({text: 'before'})
    const view = new GeometryView({padding: 1})
    const root = Stack.down([prefix, ['flex1', view]])
    const t = testRender(root, {width: 24, height: 10})
    screens.push(root.screen!)
    const points: Point[] = []
    view.addMouseListener(event => points.push(event.position), {
      events: ['mouse.button.left'],
    })
    t.render()
    // Move through a fresh viewport with the same allocation dimensions: the
    // local rectangle is cached, but the absolute origin must not be cached.
    const v = Viewport.layout(root.screen!, new Size(24, 20))
    v.clipped(new Rect([0, 5], [24, 9]), inside => view.render(inside))
    expect(view.origin).toEqual(new Point(0, 5))
    expect(view.last!.origin).toEqual(new Point(1, 6))
    t.render()
    t.sendMouse('mouse.button.down', {x: 1, y: 2})
    t.sendMouse('mouse.button.up', {x: 1, y: 2})
    expect(points.length).toBeGreaterThan(0)
    expect(points.every(p => p.isEqual(Point.zero))).toBe(true)
  })

  it('does not reuse or commit probe geometry', () => {
    const {view, t} = setup({padding: 1})
    const before = view.contentSize
    const originalOrigin = view.origin
    const v = Viewport.layout(view.screen!, new Size(12, 5))
    v._probe(probe => view.render(probe))
    expect(view.contentSize).toBe(before)
    expect(view.last!.size).toEqual(new Size(10, 3))
    expect(view.contentSize).toEqual(before)
    expect(view.origin).toEqual(originalOrigin)
    t.render()
    expect(view.contentSize).toEqual(before)
  })

  it('does not retain geometry invalidated during natural-size measurement', () => {
    const {view, t} = setup({width: 'natural', height: 'natural'})
    view.dirtyDuringMeasure = true
    view.invalidateSize()
    t.render()
    const previous = view.contentSize
    t.render()
    expect(view.contentSize).not.toBe(previous)
    view.dirtyDuringMeasure = false
  })
})
