import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {ZStack, type Location} from '../../lib/components/ZStack.js'
import {Text} from '../../lib/components/Text.js'
import {Box} from '../../lib/components/Box.js'
import {Size} from '../../lib/geometry.js'

describe('ZStack', () => {
  it('renders a single child', () => {
    const t = testRender(new ZStack({child: new Text({text: 'Hello'})}), {
      width: 10,
      height: 1,
    })
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('later children render on top of earlier ones', () => {
    const t = testRender(
      new ZStack({
        children: [new Text({text: 'AAAAAAA'}), new Text({text: 'BB'})],
      }),
      {width: 7, height: 1},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('naturalSize is the max of all children', () => {
    const zstack = new ZStack({
      children: [
        new Box({
          border: 'single',
          width: 5,
          height: 3,
          child: new Text({text: ''}),
        }),
        new Text({text: 'Hi'}),
      ],
    })
    const size = zstack.naturalSize(new Size(20, 20))
    expect(size.width).toBe(5)
    expect(size.height).toBe(3)
  })

  it('overlays a small view on top of a larger one', () => {
    const t = testRender(
      new ZStack({
        children: [new Text({text: '0123456'}), new Text({text: 'AB'})],
      }),
      {width: 7, height: 1},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('stacks multiple layers', () => {
    const t = testRender(
      new ZStack({
        children: [
          new Text({text: 'XXXXXXX'}),
          new Text({text: '..YY'}),
          new Text({text: 'Z'}),
        ],
      }),
      {width: 7, height: 1},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders empty with no children', () => {
    const t = testRender(new ZStack({}), {width: 5, height: 3})
    expect(t.terminal.textContent()).toBe('')
  })

  describe('location', () => {
    function makeAtLocation(location: Location) {
      return new ZStack({
        location,
        child: new Box({
          border: 'single',
          width: 3,
          height: 3,
          child: new Text({text: '·'}),
        }),
      })
    }

    it('naturalSize returns available when location is set', () => {
      const zstack = new ZStack({
        location: 'center',
        child: new Text({text: 'Hi'}),
      })
      const size = zstack.naturalSize(new Size(20, 10))
      expect(size.width).toBe(20)
      expect(size.height).toBe(10)
    })

    it('top-left', () => {
      const t = testRender(makeAtLocation('top-left'), {width: 7, height: 7})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('top-center', () => {
      const t = testRender(makeAtLocation('top-center'), {width: 7, height: 7})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('top-right', () => {
      const t = testRender(makeAtLocation('top-right'), {width: 7, height: 7})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('left', () => {
      const t = testRender(makeAtLocation('left'), {width: 7, height: 7})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('center', () => {
      const t = testRender(makeAtLocation('center'), {width: 7, height: 7})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('right', () => {
      const t = testRender(makeAtLocation('right'), {width: 7, height: 7})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('bottom-left', () => {
      const t = testRender(makeAtLocation('bottom-left'), {width: 7, height: 7})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('bottom-center', () => {
      const t = testRender(makeAtLocation('bottom-center'), {
        width: 7,
        height: 7,
      })
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('bottom-right', () => {
      const t = testRender(makeAtLocation('bottom-right'), {
        width: 7,
        height: 7,
      })
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })
})
