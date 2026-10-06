import {afterEach, describe, expect, it} from 'vitest'
import React, {useState} from 'react'
import {
  AlignmentPoint,
  AlignmentScope as WrAlignmentScope,
  Screen,
  TestProgram,
  Window,
  createAlignment,
} from '@teaui/core'
import {
  Alignment,
  AlignmentScope,
  At,
  Box,
  Placement,
  Stack,
  Text,
  useAlignment,
} from '../lib/components.js'
import {render} from '../lib/reconciler.js'
import {isSame} from '../lib/isSame.js'

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

let cleanup: (() => void) | undefined
afterEach(() => {
  cleanup?.()
  cleanup = undefined
})

async function mount(element: React.ReactNode, cols = 30, rows = 6) {
  const window = new Window()
  const program = new TestProgram({cols, rows})
  const screen = new Screen(program, window)
  screen.start()
  const unmount = render(screen, window, element)
  cleanup = () => {
    unmount()
    screen.stop()
  }
  await flush()
  screen.render()

  return {
    window,
    text() {
      return program.terminal.textContent()
    },
    async update() {
      await flush()
      screen.render()
    },
  }
}

describe('Alignment (React)', () => {
  it('lays out content next to the widest card, and follows state changes', async () => {
    let setWide: (wide: boolean) => void = () => {}
    function Cards() {
      const cards = useAlignment('cards')
      const [wide, setWideState] = useState(true)
      setWide = setWideState
      return (
        <AlignmentScope>
          <Placement left={0} right={cards.left.minus(1)}>
            <Text wrap>aaaaaaaaaa bbbbbbbbbbbb cccc</Text>
          </Placement>
          <At.topRight>
            <Stack.down>
              <Alignment point={cards} />
              <Stack.left>
                <Box>box1</Box>
              </Stack.left>
              <Stack.left>
                <Box>{wide ? 'box2222' : 'b2'}</Box>
              </Stack.left>
            </Stack.down>
          </At.topRight>
        </AlignmentScope>
      )
    }

    const t = await mount(<Cards />)
    expect(t.text()).toMatchSnapshot('wide')

    setWide(false)
    await t.update()
    expect(t.text()).toMatchSnapshot('narrow')
  })

  it('useAlignment returns the same point on every render', async () => {
    const points: AlignmentPoint[] = []
    let rerender: () => void = () => {}
    function Component() {
      const point = useAlignment('stable')
      const [, setCount] = useState(0)
      rerender = () => setCount(count => count + 1)
      points.push(point)
      return <Alignment point={point} />
    }

    await mount(<Component />)
    rerender()
    await flush()
    expect(points.length).toBeGreaterThan(1)
    expect(new Set(points).size).toBe(1)
    expect(points[0].name).toBe('stable')
  })

  it('compares coordinates structurally (isSame)', () => {
    const a = createAlignment('a')
    const b = createAlignment('a')
    expect(isSame(a.left.minus(1), a.left.minus(1))).toBe(true)
    expect(isSame(a.left, a.right)).toBe(true)
    expect(isSame(a.left.minus(1), a.left.minus(2))).toBe(false)
    expect(isSame(a.left, a.top)).toBe(false)
    // same name, different point
    expect(isSame(a.left, b.left)).toBe(false)
    expect(isSame(a, b)).toBe(false)
    expect(isSame(a, a)).toBe(true)
  })

  it('updates when the point or offset changes', async () => {
    const first = createAlignment('first')
    const second = createAlignment('second')
    let setState: (state: {
      point: AlignmentPoint
      gap: number
    }) => void = () => {}
    function Component() {
      const [state, setStateValue] = useState({point: first, gap: 0})
      setState = setStateValue
      return (
        <AlignmentScope>
          <Stack.right>
            <Text>{'     '}</Text>
            <Alignment point={first} />
            <Text>{'   '}</Text>
            <Alignment point={second} />
          </Stack.right>
          <Placement right={state.point.left.minus(state.gap)}>
            <Text>x</Text>
          </Placement>
        </AlignmentScope>
      )
    }

    const t = await mount(<Component />, 10, 1)
    expect(t.text()).toBe('    x')
    setState({point: first, gap: 2})
    await t.update()
    expect(t.text()).toBe('  x')
    setState({point: second, gap: 0})
    await t.update()
    expect(t.text()).toBe('       x')
  })

  it('handles conditional markers', async () => {
    let setShow: (show: boolean) => void = () => {}
    let scope: WrAlignmentScope | null = null
    const point = createAlignment('maybe')
    function Component() {
      const [show, setShowState] = useState(false)
      setShow = setShowState
      return (
        <AlignmentScope ref={view => void (scope = view)}>
          <Placement right={point.left}>
            <Text>x</Text>
          </Placement>
          {show && (
            // offset with `x`: a text of spaces would paint over the placement
            <Stack.right x={4}>
              <Alignment point={point} />
            </Stack.right>
          )}
        </AlignmentScope>
      )
    }

    const t = await mount(<Component />, 10, 1)
    expect(t.text()).toBe('')
    expect(scope!.unavailablePoints.get(point)).toBe('unmounted')

    setShow(true)
    await t.update()
    expect(t.text()).toBe('   x')
    expect(scope!.unavailablePoints.size).toBe(0)

    setShow(false)
    await t.update()
    expect(t.text()).toBe('')
    expect(point._publishers.size).toBe(0)
  })

  it('layout does not depend on the order of the children', async () => {
    let setReversed: (reversed: boolean) => void = () => {}
    function Component() {
      const point = useAlignment()
      const [reversed, setReversedState] = useState(false)
      setReversed = setReversedState
      const children = [
        <Placement key="placement" right={point.left.minus(1)}>
          <Text>abc</Text>
        </Placement>,
        <Stack.right key="producer" x={6}>
          <Alignment point={point} />
          <Text>|</Text>
        </Stack.right>,
      ]
      return (
        <AlignmentScope>
          {reversed ? children.reverse() : children}
        </AlignmentScope>
      )
    }

    const t = await mount(<Component />, 10, 1)
    expect(t.text()).toBe('  abc |')
    setReversed(true)
    await t.update()
    expect(t.text()).toBe('  abc |')
  })
})
