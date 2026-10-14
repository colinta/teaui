import {readFileSync} from 'node:fs'
import {
  HeadlessProgram,
  Pressable,
  Screen,
  Window,
  lineWidth,
  removeAnsi,
  type KeyEvent,
  type SystemMouseEvent,
  type View,
} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {pressableExample} from '../lib/examples/samples/pressable.js'

const SIZE = {width: 40, height: 6}
const INITIAL_LINES = [
  'Custom surfaces (no button decoration)',
  'Keyboard + mouse',
  'Activations: 0',
  'Mouse only (focusable: false)',
  'Activations: 0',
  'Tab then Enter, or click; Ctrl+C quits',
]
let importSequence = 0

afterEach(() => {
  vi.restoreAllMocks()
})

describe('pressable CLI component example', () => {
  it('documents the custom surface without unsupported Button props', () => {
    expect(pressableExample.name).toBe('pressable')
    expect(pressableExample.availability).toBe('both')
    expect(pressableExample.description).toContain(
      'without a Button title or decorations',
    )
    expect(
      pressableExample.props.find(prop => prop.name === 'onClick'),
    ).toEqual({
      name: 'onClick',
      type: '() => void',
      description: 'Called on a left mouse click or Enter while focused',
      availability: 'both',
    })
    expect(
      pressableExample.props.find(prop => prop.name === 'focusable'),
    ).toEqual({
      name: 'focusable',
      type: 'boolean',
      description:
        'Join the Tab focus ring and handle Enter; defaults to true. False keeps mouse activation but skips keyboard focus',
      availability: 'both',
    })
    for (const framework of ['core', 'react'] as const) {
      const props = pressableExample.props.filter(
        prop => prop.availability === 'both' || prop.availability === framework,
      )
      const names = props.map(prop => prop.name)
      expect(names).toEqual([
        'onClick',
        'focusable',
        'foreground',
        'purpose',
        'background',
        'width',
        'height',
        'child',
        'children',
        ...(framework === 'react' ? ['ref'] : []),
      ])
      expect(new Set(names).size).toBe(names.length)
      expect(names).not.toContain('title')
      expect(names).not.toContain('border')
      expect(names).not.toContain('align')
      expect(names).not.toContain('hotKey')
      expect(props.find(prop => prop.name === 'child')?.type).toBe(
        framework === 'core' ? 'View' : 'React.ReactNode',
      )
      expect(props.find(prop => prop.name === 'children')?.type).toBe(
        framework === 'core' ? 'View[]' : 'React.ReactNode',
      )
      expect(props.find(prop => prop.name === 'foreground')?.type).toBe('Color')
      expect(props.find(prop => prop.name === 'purpose')?.type).toBe(
        'Palette | Purpose',
      )
      expect(props.find(prop => prop.name === 'background')?.type).toBe('Color')
      expect(props.find(prop => prop.name === 'width')?.type).toBe('Dimension')
      expect(props.find(prop => prop.name === 'height')?.type).toBe('Dimension')
    }
    expect(pressableExample.props.find(prop => prop.name === 'ref')).toEqual({
      name: 'ref',
      type: 'React.Ref<Pressable>',
      description: 'Reference to the underlying Core Pressable',
      availability: 'react',
    })
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact deterministic executable sample',
    async framework => {
      const moduleUrl = sampleUrl(framework)
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(pressableExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|tui-|setTimeout|setInterval|Math.random|Date.now|\.\.\//,
      )
      if (framework === 'core') {
        expect(source).toContain('width: 40')
        expect(source).toContain('height: 6')
        expect(source).toContain('height: 2')
        expect(source).toContain('focusable: true')
        expect(source).toContain('focusable: false')
        expect(source).toContain("foreground: 'white'")
        expect(source).toContain("purpose: 'primary'")
        expect(source).toContain("purpose: 'proceed'")
        expect(source).toContain('new Pressable({')
        expect(source).toContain('keyboardCount.text =')
        expect(source).toContain('mouseCount.text =')
        expect(source).toContain('await Screen.start(view)')
      } else {
        expect(source).toContain('<Stack.down width={40} height={6}>')
        expect(source).toContain('<Pressable')
        expect(source).toContain('width={40}')
        expect(source).toContain('height={2}')
        expect(source).toContain('focusable={true}')
        expect(source).toContain('focusable={false}')
        expect(source).toContain('foreground="white"')
        expect(source).toContain('purpose="primary"')
        expect(source).toContain('purpose="proceed"')
        expect(source).toContain('useState(0)')
        expect(source).toContain('await run(<App />)')
        expect(source).not.toMatch(/createElement|from '@teaui\/core'/)
      }

      const originalStart = Screen.start
      const captureSpy = vi.spyOn(capture, 'captureExample')
      const stopSpy = vi.spyOn(Screen.prototype, 'stop')
      const output = await pressableExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(stopSpy).toHaveBeenCalledOnce()
      expect(Screen.start).toBe(originalStart)

      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(lines.map(line => line.trimEnd())).toEqual(INITIAL_LINES)
      expect(text).toMatchSnapshot()
      expect(await pressableExample.render[framework]()).toBe(output)
      expect(captureSpy).toHaveBeenNthCalledWith(2, moduleUrl, SIZE)
      expect(Screen.start).toBe(originalStart)
    },
  )

  it('produces identical Core and public-wrapper React ANSI output', async () => {
    // Capture replaces Screen.start temporarily, so run the frameworks sequentially.
    const core = await pressableExample.render.core()
    const react = await pressableExample.render.react()
    expect(react).toBe(core)
  })

  it.each(['core', 'react'] as const)(
    '%s sample activates custom content by Enter and left click, skipping mouse-only focus',
    async framework => {
      const program = new HeadlessProgram({cols: SIZE.width, rows: SIZE.height})
      let screen: Screen | undefined
      const start = async (view: View = new Window()) => {
        screen = new Screen(program, view)
        screen.start()
        return [screen, program, view]
      }
      vi.spyOn(Screen, 'start').mockImplementation(
        start as unknown as typeof Screen.start,
      )
      const sendKey = (name: KeyEvent['name']) => {
        screen!.dispatch({
          type: 'key',
          name,
          char: name === 'return' ? '\r' : name === 'tab' ? '\t' : name,
          full: name,
          ctrl: false,
          alt: false,
          gui: false,
          shift: false,
        })
      }
      const sendMouse = (
        name: SystemMouseEvent['name'],
        x: number,
        y: number,
        button: SystemMouseEvent['button'] = 'left',
      ) => {
        screen!.dispatch({
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
      }
      const lines = () =>
        removeAnsi(program.terminal.output)
          .split('\n')
          .map(line => line.trimEnd())
      const expectCounts = (keyboard: number, mouse: number) => {
        const expected = [...INITIAL_LINES]
        expected[2] = `Activations: ${keyboard}`
        expected[4] = `Activations: ${mouse}`
        expect(lines()).toEqual(expected)
      }

      try {
        const moduleUrl = sampleUrl(framework)
        moduleUrl.searchParams.set('pressable-test', String(importSequence++))
        await import(moduleUrl.href)
        expect(screen).toBeDefined()
        expect(screen!.currentFocusView).toBeUndefined()
        expectCounts(0, 0)
        sendKey('return')
        expectCounts(0, 0)

        sendKey('tab')
        const keyboardCard = screen!.currentFocusView
        expect(keyboardCard).toBeInstanceOf(Pressable)
        expect(keyboardCard!.hasFocus).toBe(true)
        sendKey('space')
        expectCounts(0, 0)
        sendKey('return')
        expectCounts(1, 0)

        // There is only one focusable card: Tab leaves it instead of visiting Mouse only.
        sendKey('tab')
        expect(screen!.currentFocusView).toBeUndefined()
        sendKey('return')
        expectCounts(1, 0)
        sendKey('tab')
        expect(screen!.currentFocusView).toBe(keyboardCard)

        sendMouse('mouse.move.in', 30, 1, 'unknown')
        expect(keyboardCard!.isHover).toBe(true)
        expectCounts(1, 0)
        sendMouse('mouse.button.down', 30, 1)
        expect(keyboardCard!.isPressed).toBe(true)
        expectCounts(1, 0)
        sendMouse('mouse.button.up', 30, 1)
        expect(keyboardCard!.isPressed).toBe(false)
        expectCounts(2, 0)

        // Right clicks and clicks outside either surface do not activate anything.
        sendMouse('mouse.button.down', 30, 3, 'right')
        sendMouse('mouse.button.up', 30, 3, 'right')
        sendMouse('mouse.button.down', 2, 0)
        sendMouse('mouse.button.up', 2, 0)
        expectCounts(2, 0)

        sendMouse('mouse.button.down', 30, 3)
        expectCounts(2, 0)
        sendMouse('mouse.button.up', 30, 3)
        expectCounts(2, 1)

        // Releasing outside the pressed surface cancels activation.
        sendMouse('mouse.button.down', 30, 3)
        sendMouse('mouse.move.in', 30, 5)
        sendMouse('mouse.button.up', 30, 5)
        expectCounts(2, 1)
        expect(removeAnsi(program.terminal.output)).toMatchSnapshot('activated')
      } finally {
        screen?.stop()
      }
    },
  )
})

function sampleUrl(framework: 'core' | 'react'): URL {
  return new URL(
    `../lib/examples/samples/pressable.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
    import.meta.url,
  )
}
