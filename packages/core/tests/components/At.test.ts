import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {At} from '../../lib/components/At.js'
import {Text} from '../../lib/components/Text.js'
import {Box} from '../../lib/components/Box.js'
import {Point, Size} from '../../lib/geometry.js'
import {View} from '../../lib/View.js'
import type {Viewport} from '../../lib/Viewport.js'
import type {Location} from '../../lib/components/ZStack.js'

describe('At', () => {
  it('naturalSize returns available', () => {
    const at = At.topLeft([new Text({text: 'Hi'})])
    const size = at.naturalSize(new Size(20, 10))
    expect(size.width).toBe(20)
    expect(size.height).toBe(10)
  })

  describe('static helpers', () => {
    it('topLeft', () => {
      const at = At.topLeft([new Text({text: 'X'})])
      expect(at.location).toBe('top-left')
    })

    it('topCenter', () => {
      const at = At.topCenter([new Text({text: 'X'})])
      expect(at.location).toBe('top-center')
    })

    it('topRight', () => {
      const at = At.topRight([new Text({text: 'X'})])
      expect(at.location).toBe('top-right')
    })

    it('left', () => {
      const at = At.left([new Text({text: 'X'})])
      expect(at.location).toBe('left')
    })

    it('center', () => {
      const at = At.center([new Text({text: 'X'})])
      expect(at.location).toBe('center')
    })

    it('right', () => {
      const at = At.right([new Text({text: 'X'})])
      expect(at.location).toBe('right')
    })

    it('bottomLeft', () => {
      const at = At.bottomLeft([new Text({text: 'X'})])
      expect(at.location).toBe('bottom-left')
    })

    it('bottomCenter', () => {
      const at = At.bottomCenter([new Text({text: 'X'})])
      expect(at.location).toBe('bottom-center')
    })

    it('bottomRight', () => {
      const at = At.bottomRight([new Text({text: 'X'})])
      expect(at.location).toBe('bottom-right')
    })
  })

  describe('rendering at each location', () => {
    function makeAt(location: Location) {
      return new At({
        location,
        child: new Text({text: 'Hi'}),
      })
    }

    it('top-left', () => {
      const t = testRender(makeAt('top-left'), {width: 10, height: 5})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('top-center', () => {
      const t = testRender(makeAt('top-center'), {width: 10, height: 5})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('top-right', () => {
      const t = testRender(makeAt('top-right'), {width: 10, height: 5})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('left', () => {
      const t = testRender(makeAt('left'), {width: 10, height: 5})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('center', () => {
      const t = testRender(makeAt('center'), {width: 10, height: 5})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('right', () => {
      const t = testRender(makeAt('right'), {width: 10, height: 5})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('bottom-left', () => {
      const t = testRender(makeAt('bottom-left'), {width: 10, height: 5})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('bottom-center', () => {
      const t = testRender(makeAt('bottom-center'), {width: 10, height: 5})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('bottom-right', () => {
      const t = testRender(makeAt('bottom-right'), {width: 10, height: 5})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  it('constrains positioned children to the viewport size', () => {
    class OversizedView extends View {
      naturalSize(available: Size): Size {
        return new Size(available.width, available.height + 2)
      }

      render(viewport: Viewport) {
        viewport.write('X', new Point(0, viewport.contentSize.height - 1))
      }
    }

    const t = testRender(
      new At({
        location: 'top-right',
        child: new OversizedView(),
      }),
      {width: 5, height: 3},
    )

    expect(t.terminal.textContent()).toBe('\n\nX')
  })

  it('overlays multiple children like a ZStack', () => {
    const t = testRender(
      At.center([new Text({text: 'AAAA'}), new Text({text: 'BB'})]),
      {width: 10, height: 3},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('works with box children', () => {
    const t = testRender(
      At.bottomRight([
        new Box({
          border: 'single',
          width: 5,
          height: 3,
          child: new Text({text: 'X'}),
        }),
      ]),
      {width: 10, height: 5},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders empty with no children', () => {
    const t = testRender(new At({location: 'center'}), {width: 5, height: 3})
    expect(t.terminal.textContent()).toBe('')
  })

  it('updates location', () => {
    const at = At.topLeft([new Text({text: 'X'})])
    const t = testRender(at, {width: 10, height: 5})
    expect(t.terminal.textContent()).toMatchSnapshot()

    at.location = 'bottom-right'
    t.render()
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('accepts shorthand props', () => {
    const at = At.center({
      children: [new Text({text: 'Hi'})],
    })
    expect(at.location).toBe('center')
    expect(at.children.length).toBe(1)
  })
})
