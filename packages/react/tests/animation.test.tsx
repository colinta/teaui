import {afterEach, describe, expect, it, vi} from 'vitest'
import React, {useState} from 'react'
import {
  Animation,
  Box as CoreBox,
  Screen,
  TestProgram,
  Window,
  type Easing,
} from '@teaui/core'
import {Box, type AnimationValues} from '../lib/components.js'
import {render} from '../lib/reconciler.js'
import {useAnimation} from '../lib/useAnimation.js'

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

let cleanup: (() => void) | undefined
afterEach(() => {
  cleanup?.()
  cleanup = undefined
})

async function mount(element: React.ReactNode) {
  const window = new Window()
  const program = new TestProgram({cols: 20, rows: 5})
  const screen = new Screen(program, window)
  screen.start()
  const unmount = render(screen, window, element)
  cleanup = () => {
    unmount()
    screen.stop()
  }
  await flush()
  screen.render()

  return {screen, window, unmount}
}

describe('useAnimation', () => {
  it('returns a stable instance and replaces apply on every render', async () => {
    const instances: Animation<CoreBox>[] = []
    let setFactor!: (factor: number) => void

    function Test() {
      const [factor, _setFactor] = useState(1)
      setFactor = _setFactor
      const animation = useAnimation<CoreBox>({
        apply(box, value) {
          box.x = value * factor
        },
      })
      instances.push(animation)
      return <Box animations={[animation]} />
    }

    const {screen, window} = await mount(<Test />)
    const box = window.children.find(
      (view): view is CoreBox => view instanceof CoreBox,
    )!
    instances[0].stop()

    setFactor(2)
    await flush()
    instances[0].start()
    screen.render()
    screen.tick(500)

    expect(instances).toHaveLength(2)
    expect(instances[1]).toBe(instances[0])
    expect(box.x).toBeCloseTo(1, 1)
  })

  it('only assigns changed options and responds to paused changes', async () => {
    const initial = {
      duration: 1,
      start: 0,
      end: 1,
      loops: false,
      reverse: false,
      easing: 'none' as Easing,
      paused: false,
    }
    let config = initial
    let setConfig!: (config: typeof initial) => void
    let animation!: Animation<CoreBox>

    function Test() {
      const [current, _setConfig] = useState(initial)
      config = current
      setConfig = _setConfig
      animation = useAnimation<CoreBox>({apply() {}, ...current})
      return <Box animations={animation} />
    }

    await mount(<Test />)
    animation.end = 40
    const spies = {
      apply: vi.spyOn(animation as any, 'apply', 'set'),
      duration: vi.spyOn(animation, 'duration', 'set'),
      startValue: vi.spyOn(animation as any, 'start', 'set'),
      end: vi.spyOn(animation, 'end', 'set'),
      loops: vi.spyOn(animation, 'loops', 'set'),
      reverse: vi.spyOn(animation, 'reverse', 'set'),
      easing: vi.spyOn(animation, 'easing', 'set'),
      startMethod: vi.spyOn(animation as any, 'start', 'get'),
      stop: vi.spyOn(animation, 'stop'),
    }

    setConfig({...config})
    await flush()

    expect(spies.apply).toHaveBeenCalledTimes(1)
    expect(spies.duration).not.toHaveBeenCalled()
    expect(spies.startValue).not.toHaveBeenCalled()
    expect(spies.end).not.toHaveBeenCalled()
    expect(spies.loops).not.toHaveBeenCalled()
    expect(spies.reverse).not.toHaveBeenCalled()
    expect(spies.easing).not.toHaveBeenCalled()
    expect(spies.startMethod).not.toHaveBeenCalled()
    expect(spies.stop).not.toHaveBeenCalled()
    expect(animation.end).toBe(40)

    const easing = (value: number) => value * value
    setConfig({
      duration: 2,
      start: 2,
      end: 10,
      loops: true,
      reverse: true,
      easing,
      paused: true,
    })
    await flush()

    expect(spies.apply).toHaveBeenCalledTimes(2)
    expect(spies.duration).toHaveBeenCalledTimes(1)
    expect(spies.startValue).toHaveBeenCalledTimes(1)
    expect(spies.end).toHaveBeenCalledTimes(1)
    expect(spies.loops).toHaveBeenCalledTimes(1)
    expect(spies.reverse).toHaveBeenCalledTimes(1)
    expect(spies.easing).toHaveBeenCalledTimes(1)
    expect(spies.stop).toHaveBeenCalledTimes(1)
    expect(animation.isRunning).toBe(false)

    setConfig({...config})
    await flush()
    expect(spies.apply).toHaveBeenCalledTimes(3)
    expect(spies.duration).toHaveBeenCalledTimes(1)
    expect(spies.startValue).toHaveBeenCalledTimes(1)
    expect(spies.end).toHaveBeenCalledTimes(1)
    expect(spies.loops).toHaveBeenCalledTimes(1)
    expect(spies.reverse).toHaveBeenCalledTimes(1)
    expect(spies.easing).toHaveBeenCalledTimes(1)
    expect(spies.stop).toHaveBeenCalledTimes(1)

    setConfig({...config, paused: false})
    await flush()
    expect(spies.startMethod).toHaveBeenCalledTimes(1)
    expect(animation.isRunning).toBe(true)
    expect(animation.current).toBe(2)
  })
})

describe('animations prop', () => {
  it('diffs single values and arrays by length and object identity', async () => {
    const first = new Animation<CoreBox>({apply() {}})
    const second = new Animation<CoreBox>({apply() {}})
    const firstAdd = vi.spyOn(first, '_addView')
    const firstRemove = vi.spyOn(first, '_removeView')
    const secondAdd = vi.spyOn(second, '_addView')
    const secondRemove = vi.spyOn(second, '_removeView')
    let setAnimations!: (animations: AnimationValues<CoreBox>) => void

    function Test() {
      const [animations, _setAnimations] =
        useState<AnimationValues<CoreBox>>(first)
      setAnimations = _setAnimations
      return <Box animations={animations} />
    }

    const {unmount} = await mount(<Test />)
    expect(firstAdd).toHaveBeenCalledTimes(1)
    expect(secondAdd).not.toHaveBeenCalled()

    setAnimations([first])
    await flush()
    expect(firstAdd).toHaveBeenCalledTimes(1)
    expect(firstRemove).not.toHaveBeenCalled()

    setAnimations([first, second])
    await flush()
    expect(firstAdd).toHaveBeenCalledTimes(1)
    expect(secondAdd).toHaveBeenCalledTimes(1)

    setAnimations([second])
    await flush()
    expect(firstRemove).toHaveBeenCalledTimes(1)
    expect(secondRemove).not.toHaveBeenCalled()

    unmount()
    await flush()
    expect(secondRemove).toHaveBeenCalledTimes(1)
  })
})
