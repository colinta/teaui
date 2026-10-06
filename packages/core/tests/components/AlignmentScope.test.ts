import {describe, it, expect, vi} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {
  AlignmentCoordinate,
  AlignmentError,
  createAlignment,
} from '../../lib/alignment.js'
import {Alignment} from '../../lib/components/Alignment.js'
import {AlignmentScope} from '../../lib/components/AlignmentScope.js'
import {
  Placement,
  type Props as PlacementProps,
} from '../../lib/components/Placement.js'
import {At} from '../../lib/components/At.js'
import {Box} from '../../lib/components/Box.js'
import {Geometry} from '../../lib/components/Geometry.js'
import {HotKey} from '../../lib/components/HotKey.js'
import {Input} from '../../lib/components/Input.js'
import {Pressable} from '../../lib/components/Pressable.js'
import {Stack} from '../../lib/components/Stack.js'
import {Text} from '../../lib/components/Text.js'
import {ZStack} from '../../lib/components/ZStack.js'
import {Container} from '../../lib/Container.js'
import {View} from '../../lib/View.js'
import {Rect, Size} from '../../lib/geometry.js'
import type {Viewport} from '../../lib/Viewport.js'

/**
 * A marker at a fixed location: `x`/`y` offset the ZStack's content.
 */
function markerAt(x: number, y: number, name = 'p') {
  const marker = new Alignment({name})
  return {marker, view: new ZStack({x, y, children: [marker]})}
}

/**
 * A placement's rect, relative to the scope, as of the last render.
 */
function rectOf(view: View) {
  const {x, y} = view.origin
  const {width, height} = view.contentSize
  return {x, y, width, height}
}

/**
 * Renders `producer` in a scope with a zero-sized placement at `point`, and
 * returns the resolved location of the point.
 */
function locate(
  point: Alignment,
  producer: View,
  size: {width: number; height: number},
) {
  const probe = new Placement({left: point.x, top: point.y})
  const scope = new AlignmentScope({children: [producer, probe]})
  testRender(scope, size)
  expect(scope.unavailablePoints.size).toBe(0)
  return {x: probe.origin.x, y: probe.origin.y}
}

/** Counts real (non-probe) renders. */
class RenderSpy extends View {
  renders = 0
  probes = 0

  naturalSize() {
    return new Size(1, 1)
  }

  render(viewport: Viewport) {
    if (viewport.isProbe) {
      this.probes += 1
    } else {
      this.renders += 1
    }
  }
}

function cards(box1Text: string, box2Text: string) {
  const marker = new Alignment({name: 'cards'})
  const box1 = new Text({text: box1Text})
  const box2 = new Text({text: box2Text})
  const boxes = Stack.down([
    marker,
    Stack.left([new Box({child: box1})]),
    Stack.left([new Box({child: box2})]),
  ])
  return {marker, box1, box2, boxes}
}

describe('AlignmentScope', () => {
  describe('motivating example', () => {
    it('content avoids the widest card, and updates in the same render', () => {
      const {marker, box1, box2, boxes} = cards('box1', 'box2222')
      const content = new Text({
        text: 'This content avoids the cards and wraps before the widest one.',
        wrap: true,
      })
      const scope = new AlignmentScope({
        children: [
          new Placement({left: 0, right: marker.left.minus(1), child: content}),
          At.topRight([boxes]),
        ],
      })

      const t = testRender(scope, {width: 40, height: 6})
      expect(t.terminal.textContent()).toMatchSnapshot('box2 is widest')

      box2.text = 'b2'
      t.render()
      expect(t.terminal.textContent()).toMatchSnapshot('box1 is widest')

      box1.text = 'b1'
      t.render()
      expect(t.terminal.textContent()).toMatchSnapshot('both shrink')
    })

    it('resolves the same layout whether the producer is declared first or last', () => {
      const render = (producerFirst: boolean) => {
        const {marker, boxes} = cards('box1', 'box2222')
        const placement = new Placement({
          left: 0,
          right: marker.left.minus(1),
          child: new Text({text: 'aaa bbb ccc ddd eee fff', wrap: true}),
        })
        const producer = At.topRight([boxes])
        const t = testRender(
          new AlignmentScope({
            children: producerFirst
              ? [producer, placement]
              : [placement, producer],
          }),
          {width: 20, height: 6},
        )
        return {text: t.terminal.textContent(), rect: rectOf(placement)}
      }

      const first = render(true)
      const last = render(false)
      expect(first).toEqual(last)
      expect(first.rect).toEqual({x: 0, y: 0, width: 10, height: 3})
    })

    it('terminal resize updates the placement', () => {
      const {marker, boxes} = cards('box1', 'box2222')
      const placement = new Placement({
        left: 0,
        right: marker.left.minus(1),
        child: new Text({text: 'content'}),
      })
      const scope = new AlignmentScope({
        children: [placement, At.topRight([boxes])],
      })
      testRender(scope, {width: 30, height: 6})
      expect(rectOf(placement).width).toBe(20)
      testRender(scope, {width: 12, height: 6})
      expect(rectOf(placement).width).toBe(2)
      // no room at all: the pins cross
      testRender(scope, {width: 6, height: 6})
      expect(rectOf(placement)).toEqual({x: 0, y: 0, width: 0, height: 1})
    })
  })

  describe('placement rules', () => {
    const size = {width: 20, height: 10}

    // the marker is at (10, 4)
    function place(props: (marker: Alignment) => PlacementProps) {
      const {marker, view} = markerAt(10, 4)
      const placement = new Placement({
        child: new Text({text: 'abc'}),
        ...props(marker),
      })
      testRender(new AlignmentScope({children: [view, placement]}), size)
      return rectOf(placement)
    }

    it.each([
      ['no pins', () => ({}), {x: 0, y: 0, width: 3, height: 1}],
      [
        'left',
        (p: Alignment) => ({left: p.left}),
        {x: 10, y: 0, width: 3, height: 1},
      ],
      [
        'right',
        (p: Alignment) => ({right: p.left}),
        {x: 7, y: 0, width: 3, height: 1},
      ],
      [
        'top',
        (p: Alignment) => ({top: p.top}),
        {x: 0, y: 4, width: 3, height: 1},
      ],
      [
        'bottom',
        (p: Alignment) => ({bottom: p.top}),
        {x: 0, y: 3, width: 3, height: 1},
      ],
      [
        'left and right (stretch)',
        (p: Alignment) => ({left: 2, right: p.left}),
        {x: 2, y: 0, width: 8, height: 1},
      ],
      [
        'top and bottom (stretch)',
        (p: Alignment) => ({top: 1, bottom: p.bottom}),
        {x: 0, y: 1, width: 3, height: 3},
      ],
      [
        'right with a gap',
        (p: Alignment) => ({right: p.left.minus(1)}),
        {x: 6, y: 0, width: 3, height: 1},
      ],
      [
        'left with an offset',
        (p: Alignment) => ({left: p.left.plus(2)}),
        {x: 12, y: 0, width: 3, height: 1},
      ],
      [
        'trailing pin bounds the natural size',
        () => ({right: 2}),
        {x: 0, y: 0, width: 2, height: 1},
      ],
      [
        'leading pin bounds the natural size',
        () => ({left: 18}),
        {x: 18, y: 0, width: 2, height: 1},
      ],
      [
        'crossed pins are empty at the leading pin',
        (p: Alignment) => ({left: p.left, right: 5}),
        {x: 10, y: 0, width: 0, height: 1},
      ],
      [
        'all four pins',
        (p: Alignment) => ({
          left: 1,
          top: 1,
          right: p.right,
          bottom: p.bottom.plus(1),
        }),
        {x: 1, y: 1, width: 9, height: 4},
      ],
    ])('%s', (_name, props, expected) => {
      expect(place(props)).toEqual(expected)
    })

    it('measures wrapping content with the allocated width', () => {
      const {marker, view} = markerAt(8, 0)
      const placement = new Placement({
        right: marker.left,
        child: new Text({text: 'aaa bbb ccc', wrap: true}),
      })
      const t = testRender(new AlignmentScope({children: [view, placement]}), {
        width: 20,
        height: 5,
      })
      // wrapped text fills the width it is given
      expect(rectOf(placement)).toEqual({x: 0, y: 0, width: 8, height: 2})
      expect(t.terminal.textContent()).toBe('aaa bbb\nccc')
    })

    it('clips children with explicit sizes to the placement', () => {
      const placement = new Placement({
        right: 3,
        child: new Text({text: 'abcdefgh', width: 8, minHeight: 3}),
      })
      const t = testRender(new AlignmentScope({children: [placement]}), {
        width: 10,
        height: 2,
      })
      expect(rectOf(placement)).toEqual({x: 0, y: 0, width: 3, height: 2})
      expect(t.terminal.textContent()).toBe('abc')
    })

    it('clips mouse events to the placement', () => {
      const onClick = vi.fn()
      const placement = new Placement({
        left: 0,
        right: 3,
        child: new Pressable({
          width: 10,
          onClick,
          child: new Text({text: 'press me'}),
        }),
      })
      const t = testRender(new AlignmentScope({children: [placement]}), {
        width: 10,
        height: 1,
      })
      t.sendMouse('mouse.button.down', {x: 5, y: 0})
      t.sendMouse('mouse.button.up', {x: 5, y: 0})
      expect(onClick).not.toHaveBeenCalled()
      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      t.sendMouse('mouse.button.up', {x: 1, y: 0})
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('coordinates are relative to the scope content (padding, boxes, offsets)', () => {
      const {marker, view} = markerAt(6, 0)
      const placement = new Placement({
        right: marker.left.minus(1),
        child: new Text({text: 'xx'}),
      })
      const scope = new AlignmentScope({
        padding: 1,
        children: [view, placement],
      })
      const t = testRender(new Box({x: 2, child: scope}), {
        width: 16,
        height: 5,
      })
      // `origin` is relative to the scope's frame, which includes its padding;
      // the point (and the solved rect, x=3) are relative to its content
      expect(rectOf(placement)).toEqual({x: 4, y: 1, width: 2, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('paints children in declaration order', () => {
      const {marker, view} = markerAt(2, 0)
      const under = new Placement({
        left: marker.left,
        child: new Text({text: 'under'}),
      })
      const over = new Placement({left: 0, child: new Text({text: 'OV'})})
      const t = testRender(
        new AlignmentScope({children: [over, view, under]}),
        {
          width: 10,
          height: 1,
        },
      )
      expect(t.terminal.textContent()).toBe('OVunder')

      const t2 = testRender(
        new AlignmentScope({
          children: [
            view,
            new Placement({
              left: marker.left,
              child: new Text({text: 'under'}),
            }),
            new Placement({left: 3, child: new Text({text: 'OV'})}),
          ],
        }),
        {width: 10, height: 1},
      )
      expect(t2.terminal.textContent()).toBe('  uOVer')
    })

    it('setters update the layout', () => {
      const {marker, view} = markerAt(10, 0)
      const placement = new Placement({
        right: marker.left,
        child: new Text({text: 'abc'}),
      })
      const t = testRender(new AlignmentScope({children: [view, placement]}), {
        width: 20,
        height: 2,
      })
      expect(rectOf(placement).x).toBe(7)
      placement.right = marker.left.minus(4)
      t.render()
      expect(rectOf(placement).x).toBe(3)
      placement.left = 0
      t.render()
      expect(rectOf(placement)).toEqual({x: 0, y: 0, width: 6, height: 1})
    })

    it('update() replaces the edges', () => {
      const {marker, view} = markerAt(10, 0)
      const placement = new Placement({
        right: marker.left,
        child: new Text({text: 'abc'}),
      })
      const t = testRender(new AlignmentScope({children: [view, placement]}), {
        width: 20,
        height: 2,
      })
      placement.update({left: marker.left})
      t.render()
      expect(rectOf(placement).x).toBe(10)
      expect(placement.right).toBeUndefined()
    })

    it('rejects invalid edges', () => {
      const point = createAlignment()
      expect(() => new Placement({left: 1.5})).toThrow(TypeError)
      expect(() => new Placement({left: point.top as any})).toThrow(TypeError)
      expect(() => new Placement({top: point.left as any})).toThrow(TypeError)
    })
  })

  describe('dependencies', () => {
    it('a marker inside one placement positions another', () => {
      const {marker: first, view} = markerAt(12, 0, 'first')
      const second = new Alignment({name: 'second'})
      // A: ends at `first`; publishes `second` at its own left edge
      const a = new Placement({
        right: first.left,
        child: Stack.right([second, new Text({text: 'AAA'})]),
      })
      // B: ends at `second`, declared before A and before `first`
      const b = new Placement({
        right: second.left,
        child: new Text({text: 'BB'}),
      })
      const t = testRender(new AlignmentScope({children: [b, a, view]}), {
        width: 20,
        height: 1,
      })
      expect(rectOf(a)).toEqual({x: 9, y: 0, width: 3, height: 1})
      expect(rectOf(b)).toEqual({x: 7, y: 0, width: 2, height: 1})
      expect(t.terminal.textContent()).toBe('       BBAAA')
    })

    it('rejects a placement that depends on itself', () => {
      const marker = new Alignment({name: 'self'})
      const placement = new Placement({
        right: marker.left,
        child: Stack.right([new Text({text: 'x'}), marker]),
      })
      expect(() =>
        testRender(new AlignmentScope({children: [placement]}), {
          width: 10,
          height: 1,
        }),
      ).toThrow(
        /dependency cycle: Placement\[0\] → Alignment\("self"\) in Placement\[0\]/,
      )
    })

    it('rejects multi-unit cycles', () => {
      const a = new Alignment({name: 'a'})
      const b = new Alignment({name: 'b'})
      const scope = new AlignmentScope({
        children: [
          new Placement({right: b.left, child: Stack.right([a])}),
          new Placement({right: a.left, child: Stack.right([b])}),
        ],
      })
      expect(() => testRender(scope, {width: 10, height: 1})).toThrow(
        AlignmentError,
      )
      expect(() => testRender(scope, {width: 10, height: 1})).toThrow(
        /Placement\[0\] → Alignment\("b"\) in Placement\[1\] → Alignment\("a"\) in Placement\[0\]/,
      )
    })

    it('rejects points that are published more than once', () => {
      const point = createAlignment('twice')
      const scope = new AlignmentScope({
        children: [
          new Alignment({point}),
          Stack.down([new Alignment({point})]),
          new Placement({left: point.left}),
        ],
      })
      expect(() => testRender(scope, {width: 10, height: 1})).toThrow(
        /Alignment\("twice"\) is published by 2 Alignment views/,
      )
    })

    it('rejects points published in a nested scope', () => {
      const marker = new Alignment({name: 'inner'})
      const scope = new AlignmentScope({
        children: [
          new AlignmentScope({children: [marker]}),
          new Placement({left: marker.left}),
        ],
      })
      expect(() => testRender(scope, {width: 10, height: 1})).toThrow(
        /nested AlignmentScope/,
      )
    })

    it('rejects points published outside of the scope', () => {
      const marker = new Alignment({name: 'outside'})
      const root = Stack.down([
        marker,
        new AlignmentScope({children: [new Placement({left: marker.left})]}),
      ])
      expect(() => testRender(root, {width: 10, height: 1})).toThrow(
        /not published inside this AlignmentScope/,
      )
    })

    it('rejects placements that are not direct children of a scope', () => {
      expect(() =>
        testRender(
          new AlignmentScope({
            children: [Stack.down([new Placement({left: 0})])],
          }),
          {width: 10, height: 1},
        ),
      ).toThrow(/Placement must be a direct child of an AlignmentScope/)
      expect(() =>
        testRender(new Placement({left: 0}), {width: 10, height: 1}),
      ).toThrow(AlignmentError)
    })

    it('nested scopes are independent', () => {
      const outer = new Alignment({name: 'outer'})
      const inner = new Alignment({name: 'inner'})
      const innerPlacement = new Placement({
        right: inner.left,
        child: new Text({text: 'in'}),
      })
      const outerPlacement = new Placement({
        left: outer.left,
        right: 20,
        child: new AlignmentScope({
          children: [new ZStack({x: 5, children: [inner]}), innerPlacement],
        }),
      })
      const t = testRender(
        new AlignmentScope({
          children: [new ZStack({x: 4, children: [outer]}), outerPlacement],
        }),
        {width: 20, height: 1},
      )
      expect(rectOf(outerPlacement)).toEqual({x: 4, y: 0, width: 16, height: 1})
      // relative to the inner scope
      expect(rectOf(innerPlacement)).toEqual({x: 3, y: 0, width: 2, height: 1})
      expect(t.terminal.textContent()).toBe('       in')
    })
  })

  describe('unavailable points', () => {
    it('a hidden marker leaves the placement empty, without stale coordinates', () => {
      const {marker, view} = markerAt(10, 0)
      const placement = new Placement({
        right: marker.left,
        child: new Text({text: 'abc'}),
      })
      const scope = new AlignmentScope({children: [view, placement]})
      const t = testRender(scope, {width: 20, height: 1})
      expect(t.terminal.textContent()).toBe('       abc')

      view.isVisible = false
      t.render()
      expect(t.terminal.textContent()).toBe('')
      expect(rectOf(placement)).toEqual({x: 0, y: 0, width: 0, height: 0})
      expect([...scope.unavailablePoints]).toEqual([[marker.point, 'hidden']])

      view.isVisible = true
      t.render()
      expect(t.terminal.textContent()).toBe('       abc')
      expect(scope.unavailablePoints.size).toBe(0)
    })

    it('an unmounted point leaves the placement empty', () => {
      const point = createAlignment('later')
      const placement = new Placement({
        right: point.left,
        child: new Text({text: 'abc'}),
      })
      const scope = new AlignmentScope({children: [placement]})
      const t = testRender(scope, {width: 20, height: 1})
      expect(t.terminal.textContent()).toBe('')
      expect([...scope.unavailablePoints]).toEqual([[point, 'unmounted']])

      // mount a marker for the point
      scope.add(new ZStack({x: 5, children: [new Alignment({point})]}))
      t.render()
      expect(t.terminal.textContent()).toBe('  abc')

      // and remove it again
      scope.removeChild(scope.children[1])
      t.render()
      expect(t.terminal.textContent()).toBe('')
      expect([...scope.unavailablePoints]).toEqual([[point, 'unmounted']])
    })

    it('a marker that is not rendered is unavailable', () => {
      class NoRender extends Container {
        naturalSize() {
          return Size.zero
        }
        render() {}
      }
      const marker = new Alignment({name: 'never'})
      const placement = new Placement({
        left: marker.left,
        child: new Text({text: 'x'}),
      })
      const scope = new AlignmentScope({
        children: [new NoRender({children: [marker]}), placement],
      })
      const t = testRender(scope, {width: 10, height: 1})
      expect(t.terminal.textContent()).toBe('')
      expect([...scope.unavailablePoints]).toEqual([
        [marker.point, 'not-rendered'],
      ])
    })

    it('unavailability propagates to dependent placements', () => {
      const point = createAlignment('missing')
      const second = new Alignment({name: 'second'})
      const a = new Placement({right: point.left, child: Stack.right([second])})
      const b = new Placement({left: second.left, child: new Text({text: 'b'})})
      const scope = new AlignmentScope({children: [a, b]})
      const t = testRender(scope, {width: 10, height: 1})
      expect(t.terminal.textContent()).toBe('')
      expect(new Map(scope.unavailablePoints)).toEqual(
        new Map([
          [point, 'unmounted'],
          [second.point, 'not-rendered'],
        ]),
      )
    })

    it('unavailable placements still register hotkeys', () => {
      const onPress = vi.fn()
      const placement = new Placement({
        right: createAlignment().left,
        child: new HotKey({hotKey: 'x', onPress}),
      })
      const t = testRender(new AlignmentScope({children: [placement]}), {
        width: 10,
        height: 1,
      })
      t.sendKey('x')
      expect(onPress).toHaveBeenCalledTimes(1)
    })

    it('an empty scope renders its children into the empty viewport', () => {
      const onPress = vi.fn()
      const {marker, view} = markerAt(1, 0)
      const scope = new AlignmentScope({
        height: 0,
        children: [
          view,
          new Placement({
            left: marker.left,
            child: new HotKey({hotKey: 'x', onPress}),
          }),
        ],
      })
      const t = testRender(Stack.down([scope]), {width: 10, height: 1})
      t.sendKey('x')
      expect(onPress).toHaveBeenCalledTimes(1)
    })
  })

  describe('measurement side effects', () => {
    function producerWith(...children: View[]) {
      const marker = new Alignment({name: 'cards'})
      const producer = At.topRight([Stack.down([marker, ...children])])
      const placement = new Placement({
        left: 0,
        right: marker.left,
        child: new Text({text: 'content'}),
      })
      return {scope: new AlignmentScope({children: [placement, producer]})}
    }

    it('Geometry.onLayout is only called for the real render', () => {
      // rendered just before the Geometry, so its counts tell us which pass
      // (probe or real) onLayout was called from
      const spy = new RenderSpy()
      const passes: {probes: number; renders: number}[] = []
      const onLayout = vi.fn(() => {
        passes.push({probes: spy.probes, renders: spy.renders})
      })
      const {scope} = producerWith(
        spy,
        new Geometry({width: 4, height: 1, onLayout}),
      )
      const t = testRender(scope, {width: 20, height: 3})
      expect(onLayout).toHaveBeenCalledTimes(1)
      // after the probe, during the real render
      expect(passes).toEqual([{probes: 1, renders: 1}])
      expect(onLayout).toHaveBeenCalledWith(new Size(4, 1))
      t.render()
      expect(onLayout).toHaveBeenCalledTimes(1)
    })

    it('hotkeys, key listeners, and focus are registered once', () => {
      const onPress = vi.fn()
      const onKey = vi.fn()
      const input = new Input({value: '', width: 5})
      const listening = new Text({
        text: 'k',
        keyboardListener: {listener: onKey, events: ['C-y']},
      })
      const {scope} = producerWith(
        new HotKey({hotKey: 'C-x', onPress}),
        listening,
        input,
      )
      const t = testRender(scope, {width: 20, height: 3})
      t.sendKey('x', {ctrl: true})
      expect(onPress).toHaveBeenCalledTimes(1)
      t.sendKey('y', {ctrl: true})
      expect(onKey).toHaveBeenCalledTimes(1)
      t.sendKey('a')
      expect(input.value).toBe('a')
    })

    it('does not cause a render loop', () => {
      const spy = new RenderSpy()
      const {scope} = producerWith(spy)
      const t = testRender(scope, {width: 20, height: 3})
      expect(spy.probes).toBe(1)
      t.tick(16)
      const renders = spy.renders
      t.tick(16)
      t.tick(16)
      expect(spy.renders).toBe(renders)
    })

    it('probes leave the committed geometry alone', () => {
      const marker = new Alignment()
      const text = new Text({text: 'abc'})
      // Rendered (for real) after the producer's probe, but before the
      // producer's real render.
      class Peek extends View {
        seen: Rect[] = []
        naturalSize() {
          return Size.zero
        }
        render(viewport: Viewport) {
          if (!viewport.isProbe) {
            this.seen.push(new Rect(text.origin, text.contentSize))
          }
        }
      }
      const peek = new Peek()
      const producer = new Placement({
        left: 2,
        child: Stack.down([marker, text]),
      })
      const scope = new AlignmentScope({
        children: [
          peek,
          producer,
          new Placement({
            left: marker.left.plus(4),
            child: new Text({text: 'x'}),
          }),
        ],
      })
      const t = testRender(scope, {width: 10, height: 1})
      // first render: nothing has been committed yet
      expect(peek.seen[0]).toEqual(new Rect([0, 0], [0, 0]))
      expect(text.contentSize).toEqual(new Size(3, 1))

      producer.left = 3
      t.render()
      // the previous render's geometry
      expect(peek.seen[1]).toEqual(new Rect([0, 0], [3, 1]))
      expect(rectOf(producer).x).toBe(3)
    })
  })
})

describe('Alignment', () => {
  it('is zero-sized and draws nothing', () => {
    const marker = new Alignment()
    expect(marker.naturalSize(new Size(10, 10))).toEqual(Size.zero)
    const t = testRender(Stack.down([marker, new Text({text: 'a'})]), {
      width: 5,
      height: 2,
    })
    expect(t.terminal.textContent()).toBe('a')
  })

  it('creates or binds a point', () => {
    const point = createAlignment('shared')
    expect(new Alignment({point}).point).toBe(point)
    expect(new Alignment({name: 'own'}).point.name).toBe('own')
    expect(new Alignment().left.point).toBeInstanceOf(Object)
  })

  it('can switch points', () => {
    const a = createAlignment('a')
    const b = createAlignment('b')
    const marker = new Alignment({point: a})
    const placement = new Placement({
      left: b.left,
      child: new Text({text: 'x'}),
    })
    const scope = new AlignmentScope({
      children: [new ZStack({x: 3, children: [marker]}), placement],
    })
    const t = testRender(scope, {width: 10, height: 1})
    expect(t.terminal.textContent()).toBe('')
    marker.update({point: b})
    t.render()
    expect(t.terminal.textContent()).toBe('   x')
    expect(a._publishers.size).toBe(0)
  })

  describe('in a Stack', () => {
    const size = {width: 20, height: 10}
    const item = (text: string) => new Text({text})

    it.each([
      ['down', 'leading', 0, {x: 0, y: 0}],
      ['down', 'between', 1, {x: 0, y: 3}],
      ['down', 'trailing', 2, {x: 0, y: 4}],
      ['right', 'leading', 0, {x: 0, y: 0}],
      ['right', 'between', 1, {x: 3, y: 0}],
      ['right', 'trailing', 2, {x: 4, y: 0}],
      ['up', 'leading', 0, {x: 0, y: 10}],
      ['up', 'between', 1, {x: 0, y: 7}],
      ['up', 'trailing', 2, {x: 0, y: 6}],
      ['left', 'leading', 0, {x: 20, y: 0}],
      ['left', 'between', 1, {x: 17, y: 0}],
      ['left', 'trailing', 2, {x: 16, y: 0}],
    ] as const)(
      'Stack.%s, %s marker (gap: 1)',
      (direction, _name, index, expected) => {
        const marker = new Alignment()
        const children: View[] = [
          direction === 'down' || direction === 'up'
            ? item('a\nb')
            : item('ab'),
          item('c'),
        ]
        children.splice(index, 0, marker)
        const stack = Stack[direction](children, {gap: 1})
        expect(locate(marker, stack, size)).toEqual(expected)
      },
    )

    it('markers do not add gaps or size', () => {
      const markers = [new Alignment(), new Alignment(), new Alignment()]
      const stack = Stack.down(
        [
          markers[0],
          item('a'),
          markers[1],
          markers[2],
          item('b'),
          new Alignment(),
        ],
        {gap: 1},
      )
      expect(stack.naturalSize(new Size(10, 10))).toEqual(new Size(1, 3))
      const t = testRender(stack, {width: 10, height: 10})
      expect(t.terminal.textContent()).toBe('a\n\nb')
      // consecutive markers share a position
      expect(
        locate(
          markers[1],
          Stack.down([item('a'), markers[1], markers[2], item('b')], {gap: 1}),
          size,
        ),
      ).toEqual({x: 0, y: 2})
    })

    it('a marker-only stack has no size', () => {
      const marker = new Alignment()
      const stack = Stack.down([marker, new Alignment()], {gap: 2})
      expect(stack.naturalSize(new Size(10, 10))).toEqual(Size.zero)
      expect(locate(marker, stack, size)).toEqual({x: 0, y: 0})
    })

    it('markers do not take part in flex allocation', () => {
      const marker = new Alignment()
      const flexed = new Text({text: 'f'})
      const stack = Stack.down([[1, flexed], marker, item('z')])
      expect(locate(marker, stack, {width: 5, height: 5})).toEqual({x: 0, y: 4})
      expect(flexed.contentSize).toEqual(new Size(5, 4))
    })
  })
})

describe('AlignmentCoordinate', () => {
  it('is immutable', () => {
    const point = createAlignment('p')
    const base = point.left
    const moved = base.plus(3).minus(1)
    expect(base.offset).toBe(0)
    expect(moved.offset).toBe(2)
    expect(moved.point).toBe(point)
    expect(moved).toBeInstanceOf(AlignmentCoordinate)
  })

  it('has aliases for each axis', () => {
    const point = createAlignment()
    expect([point.left.axis, point.right.axis, point.x.axis]).toEqual([
      'x',
      'x',
      'x',
    ])
    expect([point.top.axis, point.bottom.axis, point.y.axis]).toEqual([
      'y',
      'y',
      'y',
    ])
  })

  it('only accepts integer offsets', () => {
    const point = createAlignment()
    expect(() => point.left.plus(0.5)).toThrow(TypeError)
    expect(() => point.left.minus(NaN)).toThrow(TypeError)
    expect(() => point.left.plus(Infinity)).toThrow(TypeError)
  })

  it('describes itself', () => {
    const point = createAlignment('cards')
    expect(String(point.left.minus(1))).toBe('Alignment("cards").x - 1')
    expect(String(point.top.plus(2))).toBe('Alignment("cards").y + 2')
    expect(String(createAlignment().x)).toBe('Alignment(anonymous).x')
  })

  it('enforces axes in the types', () => {
    const point = createAlignment()
    expect(
      // @ts-expect-error a vertical coordinate is not a horizontal edge
      () => new Placement({right: point.top}),
    ).toThrow(TypeError)
  })
})
