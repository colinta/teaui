import {afterEach, describe, expect, it, vi} from 'vitest'
import React, {useState} from 'react'
import {
  Screen,
  TestProgram,
  Root,
  Window as WrWindow,
  Desktop as WrDesktop,
  type SystemMouseEvent,
} from '@teaui/core'
import {Button, Desktop, Text, Window} from '../lib/components.js'
import {render} from '../lib/reconciler.js'

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

let cleanup: (() => void) | undefined
afterEach(() => {
  cleanup?.()
  cleanup = undefined
})

async function mount(element: React.ReactNode, cols = 40, rows = 12) {
  const root = new Root()
  const program = new TestProgram({cols, rows})
  const screen = new Screen(program, root)
  screen.start()
  const unmount = render(screen, root, element)
  cleanup = () => {
    unmount()
    screen.stop()
  }
  await flush()
  screen.render()

  function mouse(name: SystemMouseEvent['name'], x: number, y: number) {
    program.sendEvent({
      type: 'mouse',
      name,
      x,
      y,
      button: name === 'mouse.move.in' ? 'unknown' : 'left',
      ctrl: false,
      alt: false,
      gui: false,
      shift: false,
    })
  }

  return {
    root,
    screen,
    terminal: program.terminal,
    async click(x: number, y: number) {
      mouse('mouse.button.down', x, y)
      mouse('mouse.button.up', x, y)
      await flush()
      screen.render()
    },
    async drag(from: [number, number], to: [number, number]) {
      mouse('mouse.button.down', ...from)
      mouse('mouse.button.down', ...to)
      mouse('mouse.button.up', ...to)
      await flush()
      screen.render()
    },
  }
}

describe('Window', () => {
  it('renders a window with a title and content', async () => {
    const t = await mount(
      <Window title="Editor" width={24} height={4}>
        <Text>hello</Text>
      </Window>,
    )
    expect(t.root.children[0]).toBeInstanceOf(WrWindow)
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders titleBar content in the title bar', async () => {
    const onClick = vi.fn()
    const t = await mount(
      <Window
        title="Notes"
        width={30}
        height={4}
        titleBar={<Button title="save" border="none" onClick={onClick} />}
      >
        <Text>content</Text>
      </Window>,
    )
    expect(t.terminal.textContent()).toMatchSnapshot()

    const pos = t.terminal.find('save')!
    expect(pos.y).toBe(0)
    await t.click(pos.x, pos.y)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('updates titleBar content', async () => {
    function App() {
      const [count, setCount] = useState(0)
      return (
        <Window
          title="Count"
          width={30}
          height={3}
          titleBar={<Text>[{count}]</Text>}
        >
          <Button title="inc" onClick={() => setCount(count + 1)} />
        </Window>
      )
    }
    const t = await mount(<App />)
    expect(t.terminal.textAtRow(0)).toContain('[0]')
    const pos = t.terminal.find('inc')!
    await t.click(pos.x, pos.y)
    expect(t.terminal.textAtRow(0)).toContain('[1]')
  })

  it('closes a window from React state', async () => {
    function App() {
      const [windows, setWindows] = useState(['one', 'two'])
      return (
        <Desktop>
          {windows.map((name, index) => (
            <Window
              key={name}
              title={name}
              x={index * 10}
              y={index * 3}
              width={20}
              height={4}
              onClose={() =>
                setWindows(windows.filter(other => other !== name))
              }
            />
          ))}
        </Desktop>
      )
    }
    const t = await mount(<App />)
    const desktop = t.root.children[0] as WrDesktop
    expect(desktop.windows.map(window => window.title)).toEqual(['one', 'two'])
    // 'two' close button
    await t.click(11, 3)
    expect(desktop.windows.map(window => window.title)).toEqual(['one'])
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('keeps the window where the user moved it when React re-renders', async () => {
    let rerender: () => void = () => {}
    function App() {
      const [, setCount] = useState(0)
      rerender = () => setCount(count => count + 1)
      return (
        <Desktop>
          <Window title="Move" x={2} y={1} width={20} height={4} />
        </Desktop>
      )
    }
    const t = await mount(<App />)
    const desktop = t.root.children[0] as WrDesktop
    const window = desktop.windows[0]
    await t.drag([10, 1], [15, 4])
    expect(window.position?.x).toBe(7)

    rerender()
    await flush()
    t.screen.render()
    expect(window.position?.x).toBe(7)
  })

  it('moves the window when the x/y props change', async () => {
    const onMove = vi.fn()
    let moveTo: (x: number) => void = () => {}
    function App() {
      const [x, setX] = useState(2)
      moveTo = setX
      return (
        <Desktop>
          <Window
            title="Move"
            x={x}
            y={1}
            width={20}
            height={4}
            onMove={onMove}
          />
        </Desktop>
      )
    }
    const t = await mount(<App />)
    const desktop = t.root.children[0] as WrDesktop
    await t.drag([10, 1], [20, 1])
    expect(onMove).toHaveBeenLastCalledWith(expect.objectContaining({x: 12}))
    expect(desktop.windows[0].position?.x).toBe(12)

    moveTo(5)
    await flush()
    t.screen.render()
    expect(desktop.windows[0].position?.x).toBe(5)
    expect(t.terminal.textAtRow(1)).toMatch(/^ {5}╔/)
  })
})

describe('Desktop', () => {
  it('lays out windows with the tiled layout', async () => {
    const t = await mount(
      <Desktop layout="tiled">
        <Window title="Main">
          <Text>main</Text>
        </Window>
        <Window title="Side">
          <Text>side</Text>
        </Window>
      </Desktop>,
      40,
      6,
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })
})
