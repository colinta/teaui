import {afterEach, describe, expect, it, vi} from 'vitest'
import React, {useState} from 'react'
import {
  Screen,
  TestProgram,
  Window,
  type KeyEvent,
  type MouseEvent,
  type SystemMouseEvent,
} from '@teaui/core'
import {Box, Button, Stack, Text} from '../lib/components.js'
import {render} from '../lib/reconciler.js'

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

let cleanup: (() => void) | undefined
afterEach(() => {
  cleanup?.()
  cleanup = undefined
})

async function mount(element: React.ReactNode, cols = 20, rows = 4) {
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
    screen,
    mouse(name: SystemMouseEvent['name'], x: number, y: number) {
      const button = name.startsWith('mouse.wheel')
        ? 'wheel'
        : name === 'mouse.move.in'
          ? 'unknown'
          : 'left'
      program.sendEvent({
        type: 'mouse',
        name,
        x,
        y,
        button,
        ctrl: false,
        alt: false,
        gui: false,
        shift: false,
      })
    },
    key(
      name: string,
      mods: {
        ctrl?: boolean
        alt?: boolean
        gui?: boolean
        shift?: boolean
      } = {},
    ) {
      const {ctrl = false, alt = false, gui = false, shift = false} = mods
      const full = `${ctrl ? 'C-' : ''}${alt ? 'A-' : ''}${gui ? 'G-' : ''}${shift ? 'S-' : ''}${name}`
      program.sendEvent({
        type: 'key',
        name,
        char: name.length === 1 ? name : '',
        full,
        ctrl,
        alt,
        gui,
        shift,
      } as KeyEvent)
    },
  }
}

const names = (calls: unknown[][]) =>
  calls.map(call => (call[0] as MouseEvent).name)

describe('React listener props', () => {
  describe('mouseListener', () => {
    it('with events, is called for those events', async () => {
      const listener = vi.fn()
      const app = await mount(
        <Text mouseListener={{listener, events: ['mouse.move']}}>hello</Text>,
      )

      app.mouse('mouse.move.in', 1, 0)

      expect(names(listener.mock.calls)).toEqual([
        'mouse.move.enter',
        'mouse.move.in',
      ])
    })

    it('receives the content-relative position and contentSize', async () => {
      const listener = vi.fn()
      const app = await mount(
        <Box
          border="single"
          mouseListener={{listener, events: ['mouse.move']}}
          width={10}
          height={3}
        >
          <Text>hi</Text>
        </Box>,
      )

      app.mouse('mouse.move.in', 3, 1)

      const [event, contentSize] = listener.mock.calls.at(-1)!
      expect(event.position.x).toBe(3)
      expect(event.position.y).toBe(1)
      expect(contentSize.width).toBe(10)
      expect(contentSize.height).toBe(3)
    })

    it("as a function, piggy-backs on the component's own events", async () => {
      const listener = vi.fn()
      const onClick = vi.fn()
      const app = await mount(
        <Button mouseListener={listener} onClick={onClick}>
          OK
        </Button>,
        10,
        3,
      )

      app.mouse('mouse.button.down', 2, 1)
      app.mouse('mouse.button.up', 2, 1)

      expect(onClick).toHaveBeenCalledOnce()
      expect(
        names(listener.mock.calls).filter(name =>
          name.startsWith('mouse.button'),
        ),
      ).toEqual(['mouse.button.down', 'mouse.button.up'])
    })

    it('a function on a component that registers nothing is never called', async () => {
      const listener = vi.fn()
      const app = await mount(<Text mouseListener={listener}>hello</Text>)

      app.mouse('mouse.move.in', 1, 0)
      app.mouse('mouse.button.down', 1, 0)

      expect(listener).not.toHaveBeenCalled()
    })

    it('works on containers, with children taking precedence', async () => {
      const parent = vi.fn()
      const onClick = vi.fn()
      const app = await mount(
        <Stack.down
          mouseListener={{listener: parent, events: ['mouse.button.left']}}
        >
          <Button onClick={onClick}>OK</Button>
        </Stack.down>,
        10,
        6,
      )

      // the button is on the first row of the stack
      app.mouse('mouse.button.down', 3, 0)
      app.mouse('mouse.button.up', 3, 0)
      expect(onClick).toHaveBeenCalledOnce()
      expect(parent).not.toHaveBeenCalled()

      app.mouse('mouse.button.down', 3, 4)
      app.mouse('mouse.button.up', 3, 4)
      expect(names(parent.mock.calls)).toEqual([
        'mouse.button.down',
        'mouse.button.up',
      ])
    })

    it('a re-render with a new inline function keeps the subscription and calls the latest function', async () => {
      const calls: string[] = []
      let setCount: (count: number) => void = () => {}
      function App() {
        const [count, _setCount] = useState(0)
        setCount = _setCount
        return (
          <Text
            mouseListener={{
              listener: event => calls.push(`${count}:${event.name}`),
              events: ['mouse.move'],
            }}
          >
            hello
          </Text>
        )
      }
      const app = await mount(<App />)
      app.mouse('mouse.move.in', 1, 0)

      setCount(1)
      await flush()
      app.mouse('mouse.move.in', 2, 0)

      // no second 'enter' after the re-render: the subscription was kept
      expect(calls).toEqual([
        '0:mouse.move.enter',
        '0:mouse.move.in',
        '1:mouse.move.in',
      ])
    })

    it('changing events re-subscribes, and removing the prop unsubscribes', async () => {
      const listener = vi.fn()
      let setMode: (mode: 'wheel' | 'move' | 'none') => void = () => {}
      function App() {
        const [mode, _setMode] = useState<'wheel' | 'move' | 'none'>('wheel')
        setMode = _setMode
        return (
          <Text
            mouseListener={
              mode === 'none'
                ? undefined
                : {
                    listener,
                    events: mode === 'wheel' ? ['mouse.wheel'] : ['mouse.move'],
                  }
            }
          >
            hello
          </Text>
        )
      }
      const app = await mount(<App />)

      app.mouse('mouse.move.in', 1, 0)
      expect(listener).not.toHaveBeenCalled()
      app.mouse('mouse.wheel.down', 1, 0)
      expect(names(listener.mock.calls)).toEqual(['mouse.wheel.down'])

      setMode('move')
      await flush()
      listener.mockClear()
      app.mouse('mouse.wheel.down', 1, 0)
      expect(listener).not.toHaveBeenCalled()
      app.mouse('mouse.move.in', 2, 0)
      expect(listener).toHaveBeenCalled()

      setMode('none')
      await flush()
      listener.mockClear()
      app.mouse('mouse.move.in', 3, 0)
      app.mouse('mouse.wheel.down', 3, 0)
      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('keyboardListener', () => {
    it('with hotkeys, is called when they are pressed', async () => {
      const listener = vi.fn()
      const app = await mount(
        <Text keyboardListener={{listener, events: ['ctrl+s', 'escape']}}>
          hello
        </Text>,
      )

      app.key('s', {ctrl: true})
      app.key('escape')
      app.key('s')

      expect(listener.mock.calls.map(call => call[0].full)).toEqual([
        'C-s',
        'escape',
      ])
      expect(listener.mock.calls[0][1].width).toBeGreaterThan(0)
    })

    it('`events: true` sees every key without taking it from the focused component', async () => {
      const listener = vi.fn()
      const onClick = vi.fn()
      const app = await mount(
        <Stack.down keyboardListener={{listener, events: true}}>
          <Button onClick={onClick}>OK</Button>
        </Stack.down>,
        10,
        4,
      )

      app.key('tab')
      app.key('return')

      expect(onClick).toHaveBeenCalledOnce()
      expect(listener.mock.calls.map(call => call[0].full)).toEqual([
        'tab',
        'return',
      ])
    })

    it('as a function, piggy-backs on keys the component receives', async () => {
      const listener = vi.fn()
      const onClick = vi.fn()
      const app = await mount(
        <Button keyboardListener={listener} onClick={onClick}>
          OK
        </Button>,
        10,
        3,
      )

      app.key('tab')
      app.key('return')

      expect(onClick).toHaveBeenCalledOnce()
      expect(listener.mock.calls.map(call => call[0].full)).toEqual(['return'])
    })

    it('a re-render with a new inline function calls the latest function', async () => {
      const calls: string[] = []
      let setCount: (count: number) => void = () => {}
      function App() {
        const [count, _setCount] = useState(0)
        setCount = _setCount
        return (
          <Text
            keyboardListener={{
              listener: event => calls.push(`${count}:${event.full}`),
              events: ['x'],
            }}
          >
            hello
          </Text>
        )
      }
      const app = await mount(<App />)

      app.key('x')
      setCount(1)
      await flush()
      app.key('x')

      expect(calls).toEqual(['0:x', '1:x'])
    })
  })

  describe('focusListener', () => {
    it('with events, makes the component focusable and reports focus', async () => {
      const listener = vi.fn()
      const app = await mount(
        <Text focusListener={{listener, events: true}}>hello</Text>,
      )

      app.key('tab')
      expect(listener.mock.calls).toEqual([[true]])

      app.key('tab')
      expect(listener.mock.calls).toEqual([[true], [false]])
    })

    it('participates in the focus ring with other components', async () => {
      const first = vi.fn()
      const second = vi.fn()
      const app = await mount(
        <Stack.down>
          <Text focusListener={{listener: first, events: true}}>one</Text>
          <Button focusListener={second}>two</Button>
        </Stack.down>,
        10,
        6,
      )

      app.key('tab')
      expect(first.mock.calls).toEqual([[true]])
      expect(second).not.toHaveBeenCalled()

      app.key('tab')
      expect(first.mock.calls).toEqual([[true], [false]])
      expect(second.mock.calls).toEqual([[true]])
    })

    it('isDefault takes the initial focus', async () => {
      const listener = vi.fn()
      await mount(
        <Text focusListener={{listener, events: true, isDefault: true}}>
          hello
        </Text>,
      )

      expect(listener.mock.calls).toEqual([[true]])
    })

    it('removing the prop makes the component unfocusable', async () => {
      const listener = vi.fn()
      let setEnabled: (enabled: boolean) => void = () => {}
      function App() {
        const [enabled, _setEnabled] = useState(true)
        setEnabled = _setEnabled
        return (
          <Text focusListener={enabled ? {listener, events: true} : undefined}>
            hello
          </Text>
        )
      }
      const app = await mount(<App />)

      setEnabled(false)
      await flush()
      app.key('tab')

      expect(listener).not.toHaveBeenCalled()
    })
  })

  it('can be combined with a ref and imperative listeners', async () => {
    const ref = React.createRef<import('@teaui/core').View>()
    const fromProp = vi.fn()
    const fromRef = vi.fn()
    const app = await mount(
      <Text
        ref={ref as any}
        mouseListener={{listener: fromProp, events: ['mouse.wheel']}}
      >
        hello
      </Text>,
    )
    ref.current!.addMouseListener(fromRef, {events: ['mouse.wheel']})
    app.screen.render()

    app.mouse('mouse.wheel.down', 1, 0)

    expect(fromProp).toHaveBeenCalledOnce()
    expect(fromRef).toHaveBeenCalledOnce()
  })
})
