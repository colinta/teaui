import {afterEach, describe, expect, it, vi} from 'vitest'
import React, {useState} from 'react'
import {
  Animation,
  Box as CoreBox,
  Screen,
  TestProgram,
  Window,
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
