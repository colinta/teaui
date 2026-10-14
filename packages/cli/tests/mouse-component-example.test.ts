import {existsSync, readFileSync} from 'node:fs'
import {
  HeadlessProgram,
  Screen,
  Window,
  lineWidth,
  removeAnsi,
  type SystemMouseEvent,
  type View,
} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {mouseExample} from '../lib/examples/samples/mouse.js'

const SIZE = {width: 40, height: 4}
const INITIAL_LINES = [
  'Click or scroll this region',
  'Last event: none',
  'Position: none',
  'Ctrl+C quits',
]
let importSequence = 0

afterEach(() => {
  vi.restoreAllMocks()
})

describe('mouse CLI component example', () => {
  it('documents the non-visual fallback region and framework-specific children', () => {
    expect(mouseExample.name).toBe('mouse')
    expect(mouseExample.availability).toBe('both')
    expect(mouseExample.description).toContain('without visual decoration')
    expect(mouseExample.description).toContain(
      'child button and wheel handlers take priority',
    )
    expect(mouseExample.description).toContain(
      'movement may reach both child and ancestor',
    )
    expect(mouseExample.props.find(prop => prop.name === 'mouse')).toEqual({
      name: 'mouse',
      type: 'MouseEventListenerName | MouseEventListenerName[]',
      description:
        'Event groups to receive; defaults to mouse.button.all, mouse.wheel, and mouse.move. An empty array disables registration',
      availability: 'both',
    })
    expect(mouseExample.props.find(prop => prop.name === 'onMouse')).toEqual({
      name: 'onMouse',
      type: '(event: MouseEvent, system: System) => void',
      description:
        'Called for matching events; event.position is relative to the Mouse region, not the terminal',
      availability: 'both',
    })
    for (const framework of ['core', 'react'] as const) {
      const props = mouseExample.props.filter(
        prop => prop.availability === 'both' || prop.availability === framework,
      )
      const names = props.map(prop => prop.name)
      expect(names).toEqual([
        'mouse',
        'onMouse',
        'child',
        'children',
        'width',
        'height',
        ...(framework === 'react' ? ['ref'] : []),
      ])
      expect(new Set(names).size).toBe(names.length)
      expect(props.find(prop => prop.name === 'child')?.type).toBe(
        framework === 'core' ? 'View' : 'React.ReactNode',
      )
      expect(props.find(prop => prop.name === 'children')?.type).toBe(
        framework === 'core' ? 'View[]' : 'React.ReactNode',
      )
      expect(props.find(prop => prop.name === 'width')?.type).toBe('Dimension')
      expect(props.find(prop => prop.name === 'height')?.type).toBe('Dimension')
    }
    expect(mouseExample.props.find(prop => prop.name === 'ref')).toEqual({
      name: 'ref',
      type: 'React.Ref<Mouse>',
      description: 'Reference to the underlying Core Mouse',
      availability: 'react',
    })
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact executable region sample',
    async framework => {
      const moduleUrl = sampleUrl(framework)
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(mouseExample.source[framework]()).toBe(source)
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|tui-|setTimeout/,
      )
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).toContain('event.position.x')
      expect(source).toContain('event.position.y')
      if (framework === 'core') {
        expect(source).toContain('width: 40')
        expect(source).toContain('height: 4')
        expect(source).toContain("mouse: ['mouse.button.left', 'mouse.wheel']")
        expect(source).toContain('new Mouse(')
        expect(source).toContain('lastEvent.text =')
        expect(source).toContain('await Screen.start(view)')
      } else {
        expect(moduleUrl.pathname).toMatch(/\.react\.tsx$/)
        expect(
          existsSync(
            new URL('../lib/examples/samples/mouse.react.js', import.meta.url),
          ),
        ).toBe(false)
        expect(source).toContain('<Stack.down width={40} height={4}>')
        expect(source).toContain('<Mouse')
        expect(source).toContain('width={40}')
        expect(source).toContain('height={3}')
        expect(source).toContain("mouse={['mouse.button.left', 'mouse.wheel']}")
        expect(source).toContain('onMouse={event => {')
        expect(source).toContain('<Text>Last event: {lastEvent}</Text>')
        expect(source).toContain('<Text>Position: {position}</Text>')
        expect(source).toContain("useState('none')")
        expect(source).toContain('await run(<App />)')
        expect(source).not.toContain('createElement')
        expect(source).not.toContain("from '@teaui/core'")
      }

      const originalStart = Screen.start
      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await mouseExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(Screen.start).toBe(originalStart)

      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(lines.map(line => line.trimEnd())).toEqual(INITIAL_LINES)
      expect(text).toMatchSnapshot()
      expect(await mouseExample.render[framework]()).toBe(output)
      expect(Screen.start).toBe(originalStart)
    },
  )

  it('produces identical Core and public-wrapper React output', async () => {
    expect(await mouseExample.render.react()).toBe(
      await mouseExample.render.core(),
    )
  })

  it.each(['core', 'react'] as const)(
    '%s handles left clicks and wheel events with region-local positions only',
    async framework => {
      const program = new HeadlessProgram({cols: SIZE.width, rows: SIZE.height})
      let screen: Screen | undefined
      const start = async (view: View = new Window()) => {
        screen = new Screen(program, view, {isFocused: false})
        screen.start()
        return [screen, program, view]
      }
      vi.spyOn(Screen, 'start').mockImplementation(
        start as unknown as typeof Screen.start,
      )
      const sendMouse = (
        name: SystemMouseEvent['name'],
        x: number,
        y: number,
        button: SystemMouseEvent['button'] = 'left',
      ) => {
        screen!.trigger({
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
        screen!.render()
      }
      const lines = () =>
        removeAnsi(program.terminal.output)
          .split('\n')
          .map(line => line.trimEnd())

      try {
        const moduleUrl = sampleUrl(framework)
        moduleUrl.searchParams.set('mouse-test', String(importSequence++))
        await import(moduleUrl.href)
        expect(screen).toBeDefined()
        expect(lines()).toEqual(INITIAL_LINES)

        // The heading is outside the region; moves and right clicks are excluded.
        sendMouse('mouse.button.down', 3, 0)
        sendMouse('mouse.button.up', 3, 0)
        sendMouse('mouse.move.in', 3, 2, 'unknown')
        sendMouse('mouse.button.down', 3, 2, 'right')
        sendMouse('mouse.button.up', 3, 2, 'right')
        expect(lines()).toEqual(INITIAL_LINES)

        sendMouse('mouse.button.down', 3, 2)
        expect(lines()).toEqual([
          INITIAL_LINES[0],
          'Last event: mouse.button.down',
          'Position: 3, 1',
          INITIAL_LINES[3],
        ])
        sendMouse('mouse.button.up', 3, 2)
        expect(lines()[1]).toBe('Last event: mouse.button.up')

        sendMouse('mouse.wheel.down', 5, 3, 'wheel')
        expect(lines()).toEqual([
          INITIAL_LINES[0],
          'Last event: mouse.wheel.down',
          'Position: 5, 2',
          INITIAL_LINES[3],
        ])
        expect(removeAnsi(program.terminal.output)).toMatchSnapshot()
      } finally {
        screen?.stop()
      }
    },
  )
})

function sampleUrl(framework: 'core' | 'react'): URL {
  return new URL(
    `../lib/examples/samples/mouse.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
    import.meta.url,
  )
}
