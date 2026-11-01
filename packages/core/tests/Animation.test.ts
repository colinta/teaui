import {describe, expect, it, vi} from 'vitest'
import {Animation} from '../lib/Animation.js'
import {testRender} from '../lib/TestScreen.js'
import {Text} from '../lib/components/Text.js'
import {Box} from '../lib/components/Box.js'
import {Stack} from '../lib/components/Stack.js'

describe('Animation', () => {
  it('interpolates from 0 to 1 by default and stops at the end', () => {
    const view = new Text({text: 'animated'})
    const apply = vi.fn((target: Text, value: number) => {
      target.y = value
    })
    const animation = new Animation({apply})

    const t = testRender(view, {width: 20, height: 5})
    view.addAnimation(animation)
    expect(apply).toHaveBeenLastCalledWith(view, 0, 0)
    t.render()

    t.tick(500)
    expect(animation.current).toBe(0.5)
    expect(animation.time).toBe(0.5)
    expect(view.y).toBe(0.5)
    expect(animation.isRunning).toBe(true)

    t.tick(500)
    expect(animation.current).toBe(1)
    expect(animation.time).toBe(1)
    expect(view.y).toBe(1)
    expect(animation.isRunning).toBe(false)

    t.tick(500)
    expect(animation.current).toBe(1)
    expect(apply).toHaveBeenCalledTimes(3)
  })

  it('interpolates between start and end values', () => {
    const view = new Text({text: 'animated'})
    const animation = new Animation<Text>({
      apply(target, value) {
        target.y = value
      },
      start: 10,
      end: 20,
      duration: 2,
    })
    view.addAnimation(animation)
    const t = testRender(view, {width: 20, height: 5})

    t.tick(1000)
    expect(animation.current).toBe(15)
    expect(view.y).toBe(15)
  })

  it('advances a shared animation only once per tick', () => {
    const first = new Text({text: 'first'})
    const second = new Text({text: 'second'})
    const values: number[] = []
    const animation = new Animation({
      apply(_view, value) {
        values.push(value)
      },
    })
    first.addAnimation(animation)
    second.addAnimation(animation)
    const t = testRender(Stack.down([first, second]), {width: 20, height: 2})

    t.tick(500)

    expect(animation.current).toBe(0.5)
    expect(animation.time).toBe(0.5)
    expect(values).toEqual([0, 0, 0.5, 0.5])
  })

  it('supports constructor attachment to multiple views', () => {
    const first = new Text({text: 'first'})
    const second = new Text({text: 'second'})
    const animation = new Animation([first, second], {
      apply(view, value) {
        view.y = value
      },
      start: 2,
      end: 4,
    })

    expect(first.y).toBe(2)
    expect(second.y).toBe(2)
    expect(animation.current).toBe(2)

    const t = testRender(Stack.down([first, second]), {width: 20, height: 5})
    t.tick(500)
    expect(first.y).toBe(3)
    expect(second.y).toBe(3)
    expect(animation.current).toBe(3)
  })

  it('loops using elapsed seconds within each loop', () => {
    const view = new Text({text: 'animated'})
    const times: number[] = []
    const animation = new Animation({
      apply(_view, _value, time) {
        times.push(time)
      },
      duration: 2,
      loops: true,
    })
    view.addAnimation(animation)
    const t = testRender(view, {width: 20, height: 2})

    t.tick(2500)

    expect(animation.current).toBe(0.25)
    expect(animation.time).toBe(0.5)
    expect(animation.isRunning).toBe(true)
    expect(times).toEqual([0, 0.5])
  })

  it('reverses direction between loops and preserves it when resumed', () => {
    const view = new Text({text: 'animated'})
    const animation = new Animation({
      apply() {},
      start: 0,
      end: 10,
      loops: true,
      reverse: true,
    })
    view.addAnimation(animation)
    const t = testRender(view, {width: 20, height: 2})

    t.tick(500)
    expect(animation.current).toBe(5)
    expect(animation.direction).toBe(1)

    t.tick(500)
    expect(animation.current).toBe(10)
    expect(animation.direction).toBe(-1)
    expect(animation.time).toBe(0)

    t.tick(500)
    expect(animation.current).toBe(5)
    expect(animation.direction).toBe(-1)

    animation.stop()
    animation.start()
    expect(animation.current).toBe(5)
    expect(animation.time).toBe(0.5)
    expect(animation.direction).toBe(-1)

    t.tick(500)
    expect(animation.current).toBe(0)
    expect(animation.direction).toBe(1)

    animation.start(false)
    expect(animation.current).toBe(0)
    expect(animation.direction).toBe(1)
  })

  it('supports custom easing', () => {
    const view = new Text({text: 'animated'})
    const animation = new Animation({
      apply() {},
      start: 0,
      end: 10,
      easing: progress => progress * progress,
    })
    view.addAnimation(animation)
    const t = testRender(view, {width: 20, height: 2})

    t.tick(500)
    expect(animation.current).toBe(2.5)
  })

  it('retargets a running animation from its current value', () => {
    const view = new Text({text: 'animated'})
    const animation = new Animation({apply() {}, end: 10})
    view.addAnimation(animation)
    const t = testRender(view, {width: 20, height: 2})

    t.tick(500)
    animation.end = 50

    expect(animation.startValue).toBe(5)
    expect(animation.current).toBe(5)
    expect(animation.time).toBe(0)

    t.tick(500)
    expect(animation.current).toBe(27.5)
  })

  it('setting start resets and immediately applies the animation', () => {
    const view = new Text({text: 'animated'})
    const animation = new Animation<Text>({
      apply(target, value) {
        target.y = value
      },
      end: 50,
    })
    view.addAnimation(animation)
    const t = testRender(view, {width: 20, height: 5})

    t.tick(500)
    animation.start = 10

    expect(animation.current).toBe(10)
    expect(animation.time).toBe(0)
    expect(view.y).toBe(10)
    expect(animation.isRunning).toBe(true)

    t.tick(500)
    expect(animation.current).toBe(30)
  })

  it('starts, stops, and toggles', () => {
    const view = new Text({text: 'animated'})
    const animation = new Animation({apply() {}})
    view.addAnimation(animation)
    const t = testRender(view, {width: 20, height: 2})

    t.tick(500)
    animation.stop()
    t.tick(500)
    expect(animation.current).toBe(0.5)
    expect(animation.isRunning).toBe(false)

    animation.start()
    expect(animation.current).toBe(0.5)
    expect(animation.time).toBe(0.5)
    expect(animation.isRunning).toBe(true)

    animation.toggle()
    expect(animation.isRunning).toBe(false)
    animation.toggle()
    expect(animation.isRunning).toBe(true)
    expect(animation.current).toBe(0.5)

    animation.stop()
    animation.start(false)
    expect(animation.current).toBe(0)
    expect(animation.time).toBe(0)
    expect(animation.isRunning).toBe(true)
  })

  it('can remove an animation from one view without affecting others', () => {
    const first = new Text({text: 'first'})
    const second = new Text({text: 'second'})
    const firstValues: number[] = []
    const secondValues: number[] = []
    const animation = new Animation({
      apply(view, value) {
        ;(view === first ? firstValues : secondValues).push(value)
      },
    })
    first.addAnimation(animation)
    second.addAnimation(animation)
    const t = testRender(Stack.down([first, second]), {width: 20, height: 2})

    first.removeAnimation(animation)
    t.tick(500)

    expect(firstValues).toEqual([0])
    expect(secondValues).toEqual([0, 0.5])
  })

  it('preserves a view subclass receiveTick implementation', () => {
    class TickText extends Text {
      elapsed = 0

      override receiveTick(dt: number): boolean {
        this.elapsed += dt
        return false
      }
    }

    const view = new TickText({text: 'animated'})
    const animation = new Animation({apply() {}})
    view.addAnimation(animation)
    const t = testRender(view, {width: 20, height: 2})

    t.tick(500)
    expect(view.elapsed).toBe(500)
    expect(animation.current).toBe(0.5)
  })

  it('types apply and addAnimation against the view subtype', () => {
    const view = new Text({text: 'not a box'})
    const box = new Box({})
    const animation = new Animation<Box>({
      apply(target) {
        target.border = 'rounded'
      },
    })

    // @ts-expect-error Animation<Box> cannot be attached to a plain View
    view.addAnimation(animation)
    box.addAnimation(animation)
  })

  it('supports paused construction and replacing apply', () => {
    const view = new Text({text: 'animated'})
    const firstApply = vi.fn()
    const secondApply = vi.fn()
    const animation = new Animation({apply: firstApply, paused: true})
    view.addAnimation(animation)
    const t = testRender(view, {width: 20, height: 2})

    t.tick(500)
    expect(animation.current).toBe(0)
    expect(animation.isRunning).toBe(false)
    expect(firstApply).toHaveBeenCalledTimes(1)

    animation.apply = secondApply
    animation.start(false)
    expect(secondApply).toHaveBeenCalledWith(view, 0, 0)
    expect(firstApply).toHaveBeenCalledTimes(1)
  })

  it('allows a generic View animation on view subtypes', () => {
    const box = new Box({})
    const animation = new Animation({apply() {}})

    box.addAnimation(animation)
    box.removeAnimation(animation)
  })

  it('rejects non-positive and non-finite durations', () => {
    expect(() => new Animation({apply() {}, duration: 0})).toThrow(RangeError)
    expect(
      () => new Animation({apply() {}, duration: Number.POSITIVE_INFINITY}),
    ).toThrow(RangeError)
  })
})
