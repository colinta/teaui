import {afterEach, describe, expect, it, vi} from 'vitest'
import {Buffer} from '../lib/Buffer.js'
import {Screen} from '../lib/Screen.js'
import {TestProgram} from '../lib/TestProgram.js'
import {Viewport} from '../lib/Viewport.js'
import {Point, Rect, Size} from '../lib/geometry.js'
import {Style} from '../lib/Style.js'
import {Text} from '../lib/components/Text.js'

const screens: Screen[] = []
afterEach(() => {
  for (const screen of screens.splice(0)) {
    screen.stop()
  }
})

function setup() {
  const size = new Size(12, 8)
  const program = new TestProgram({cols: size.width, rows: size.height})
  const screen = new Screen(program, new Text())
  screens.push(screen)
  screen.start()
  const buffer = new Buffer()
  buffer.resize(size)
  return {screen, program, buffer, viewport: new Viewport(screen, buffer, size)}
}

function state(v: Viewport) {
  return {
    size: v.contentSize,
    available: v.availableRect,
    visible: v.visibleRect,
    origin: v.absoluteOrigin,
    location: v.location,
  }
}

// Mathematical reference of the original clip, including an empty visible
// rectangle whose origin lies beyond the content bounds.
function expected(v: Viewport, clip: Rect) {
  const x = Math.max(0, v.visibleRect.origin.x - clip.origin.x)
  const y = Math.max(0, v.visibleRect.origin.y - clip.origin.y)
  return {
    size: clip.size,
    available: new Rect(
      v.availableRect.origin.offset(-clip.origin.x, -clip.origin.y),
      v.availableRect.size,
    ),
    visible: new Rect(
      [x, y],
      [
        Math.max(
          0,
          Math.min(clip.size.width, v.visibleRect.maxX() - clip.origin.x) - x,
        ),
        Math.max(
          0,
          Math.min(clip.size.height, v.visibleRect.maxY() - clip.origin.y) - y,
        ),
      ],
    ),
    origin: v.absoluteOrigin.offset(clip.origin),
    location: v.location.offset(clip.origin),
  }
}

describe('Viewport identity clipping', () => {
  it('matches general clipping for visible, partial, offscreen and zero-sized clips', () => {
    const {viewport} = setup()
    for (const outer of [
      new Rect([0, 0], [12, 8]),
      new Rect([-4, -2], [20, 12]),
      new Rect([20, 0], [4, 3]),
      new Rect([-20, -10], [4, 3]),
      new Rect([2, 1], [0, 0]),
    ]) {
      viewport.clipped(outer, v => {
        for (const clip of [
          v.contentRect,
          new Rect([1, 1], [2, 2]),
          v.contentRect,
        ]) {
          const before = state(v)
          const wanted = expected(v, clip)
          v.clipped(clip, inside => expect(state(inside)).toEqual(wanted))
          expect(state(v)).toEqual(before)
        }
      })
    }
  })

  it('reuses geometry but scopes pen and resetLocationOrigin changes', () => {
    const {viewport, buffer, program} = setup()
    viewport.clipped(new Rect([3, 2], [5, 4]), v => {
      const before = state(v)
      v.clipped(v.contentRect, new Style({foreground: 'red'}), inside => {
        expect(inside.contentSize).toBe(before.size)
        expect(inside.visibleRect).toBe(before.visible)
        expect(inside.availableRect).toBe(before.available)
        inside.resetLocationOrigin()
        expect(inside.location).toEqual(Point.zero)
        inside.write('r', Point.zero)
      })
      expect(state(v)).toEqual(before)
      v.write('d', new Point(1, 0))
    })
    buffer.flush(program)
    expect(program.terminal.styleAt(3, 2).foreground).toBe('red')
    expect(program.terminal.styleAt(4, 2).foreground).toBe('default')
  })

  it('still clips visibility outside the content after inset', () => {
    const {viewport} = setup()
    viewport.inset(new Rect([1, 1], [10, 6]), v => {
      expect(v.visibleRect.origin).toEqual(new Point(-1, -1))
      const before = state(v)
      const wanted = expected(v, v.contentRect)
      v.clipped(v.contentRect, inside => {
        expect(state(inside)).toEqual(wanted)
        expect(inside.visibleRect).toEqual(new Rect(Point.zero, [10, 6]))
        expect(inside.availableRect).toEqual(before.available)
      })
      expect(state(v)).toEqual(before)
    })
  })

  it.each([true, false])(
    'restores state after throwing from nested inset (identity: %s)',
    identity => {
      const {viewport} = setup()
      const before = state(viewport)
      const error = new Error('draw failed')
      expect(() =>
        viewport.clipped(
          identity ? viewport.contentRect : new Rect([1, 1], [4, 4]),
          v => {
            v.resetLocationOrigin()
            v.inset(new Rect([2, 2], [1, 1]), () => {
              throw error
            })
          },
        ),
      ).toThrow(error)
      expect(state(viewport)).toEqual(before)
    },
  )

  it('restores the registration owner after a nested _render throws', () => {
    const {viewport, screen} = setup()
    const register = vi.spyOn(screen, 'registerHotKey')
    const outer = new Text({text: 'outer'})
    const inner = new Text({text: 'inner'})
    viewport._render(outer, viewport.contentRect, v => {
      expect(() =>
        v._render(inner, v.contentRect, () => {
          throw new Error('failed')
        }),
      ).toThrow('failed')
      v.registerHotKey({char: 'x'})
    })
    expect(register).toHaveBeenCalledExactlyOnceWith(outer, {char: 'x'})
    register.mockRestore()
  })
})
