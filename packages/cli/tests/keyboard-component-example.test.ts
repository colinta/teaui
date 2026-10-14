import {existsSync, readFileSync} from 'node:fs'
import {
  HeadlessProgram,
  Screen,
  Window,
  lineWidth,
  removeAnsi,
  type KeyEvent,
  type View,
} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {keyboardExample} from '../lib/examples/samples/keyboard.js'
import * as capture from '../lib/examples/samples/capture.js'

const SIZE = {width: 32, height: 3}
const INITIAL_LINES = [
  'Press an unhandled key',
  'Last key: none',
  'Ctrl+C quits',
]

let importSequence = 0

afterEach(() => {
  vi.restoreAllMocks()
})

describe('keyboard CLI component example', () => {
  it('documents the non-visual fallback handler and framework-specific children', () => {
    expect(keyboardExample.name).toBe('keyboard')
    expect(keyboardExample.availability).toBe('both')
    expect(keyboardExample.description).toContain('without taking focus')
    expect(keyboardExample.description).toContain('innermost registered')
    expect(keyboardExample.props.find(prop => prop.name === 'onKey')).toEqual({
      name: 'onKey',
      type: '(event: KeyEvent) => void',
      description:
        'Called only when no hotkey matches and no view has focus; event.full includes modifier prefixes such as C- and S-',
      availability: 'both',
    })

    for (const framework of ['core', 'react'] as const) {
      const props = keyboardExample.props.filter(
        prop => prop.availability === 'both' || prop.availability === framework,
      )
      const names = props.map(prop => prop.name)
      expect(names).toEqual([
        'onKey',
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
    expect(keyboardExample.props.find(prop => prop.name === 'ref')).toEqual({
      name: 'ref',
      type: 'React.Ref<Keyboard>',
      description: 'Reference to the underlying Core Keyboard',
      availability: 'react',
    })
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact executable fallback sample',
    async framework => {
      const moduleUrl = sampleUrl(framework)
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(keyboardExample.source[framework]()).toBe(source)
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|tui-|setTimeout/,
      )
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).toContain('event.full')
      expect(source).toContain('No focusable children')
      if (framework === 'core') {
        expect(source).toContain('width: 32')
        expect(source).toContain('height: 3')
        expect(source).toContain('new Keyboard(')
        expect(source).toContain('status.text =')
        expect(source).toContain('await Screen.start(keyboard)')
      } else {
        expect(moduleUrl.pathname).toMatch(/\.react\.tsx$/)
        expect(
          existsSync(
            new URL(
              '../lib/examples/samples/keyboard.react.js',
              import.meta.url,
            ),
          ),
        ).toBe(false)
        expect(source).toContain('<Keyboard width={32} height={3}')
        expect(source).toContain('onKey={event => setLastKey(event.full)}')
        expect(source).toContain('<Stack.down>')
        expect(source).toContain('<Text>Last key: {lastKey}</Text>')
        expect(source).toContain("useState('none')")
        expect(source).toContain('await run(<App />)')
        expect(source).not.toContain('createElement')
        expect(source).not.toContain("from '@teaui/core'")
      }

      const originalStart = Screen.start
      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await keyboardExample.render[framework]()
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
      expect(await keyboardExample.render[framework]()).toBe(output)
      expect(Screen.start).toBe(originalStart)
    },
  )

  it('produces identical Core and public-wrapper React output', async () => {
    expect(await keyboardExample.render.react()).toBe(
      await keyboardExample.render.core(),
    )
  })

  it.each(['core', 'react'] as const)(
    '%s updates its displayed status from printable and modified fallback keys',
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

      try {
        const moduleUrl = sampleUrl(framework)
        moduleUrl.searchParams.set('keyboard-test', String(importSequence++))
        await import(moduleUrl.href)
        expect(screen).toBeDefined()
        expect(
          removeAnsi(program.terminal.output)
            .split('\n')
            .map(line => line.trimEnd()),
        ).toEqual(INITIAL_LINES)

        const event: KeyEvent = {
          type: 'key',
          name: 'x',
          char: 'x',
          full: 'x',
          ctrl: false,
          alt: false,
          gui: false,
          shift: false,
        }
        screen!.trigger(event)
        expect(removeAnsi(program.terminal.output)).toContain('Last key: x')

        screen!.trigger({...event, full: 'C-S-x', ctrl: true, shift: true})
        const text = removeAnsi(program.terminal.output)
        expect(text.split('\n').map(line => line.trimEnd())).toEqual([
          INITIAL_LINES[0],
          'Last key: C-S-x',
          INITIAL_LINES[2],
        ])
        expect(text).toMatchSnapshot()
      } finally {
        screen?.stop()
      }
    },
  )
})

function sampleUrl(framework: 'core' | 'react'): URL {
  return new URL(
    `../lib/examples/samples/keyboard.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
    import.meta.url,
  )
}
