import {readFileSync} from 'node:fs'
import {
  HeadlessProgram,
  HotKey,
  Screen,
  Size,
  Window,
  lineWidth,
  removeAnsi,
  type KeyEvent,
  type View,
} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {hotkeyExample} from '../lib/examples/samples/hotkey.js'

const SIZE = {width: 48, height: 3}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('hotkey CLI component example', () => {
  it('documents the required shortcut, optional event callback, and non-visual label', () => {
    expect(hotkeyExample.name).toBe('hotkey')
    expect(hotkeyExample.availability).toBe('both')
    expect(hotkeyExample.description).toContain('non-visual')
    expect(hotkeyExample.description).toContain('without requiring focus')
    expect(
      hotkeyExample.props.map(({name, type, availability}) => ({
        name,
        type,
        availability,
      })),
    ).toEqual([
      {name: 'hotKey', type: 'HotKeyProp', availability: 'both'},
      {name: 'label', type: 'string', availability: 'both'},
      {
        name: 'onPress',
        type: '(event: KeyEvent) => void',
        availability: 'both',
      },
      {name: 'ref', type: 'React.Ref<HotKey>', availability: 'react'},
    ])
    const description = (name: string) =>
      hotkeyExample.props.find(prop => prop.name === name)?.description
    expect(description('hotKey')).toContain('Required FullKeyName')
    expect(description('hotKey')).toContain('HotKeyDef object')
    expect(description('hotKey')).toContain('C-, A-, G-, S-')
    expect(description('label')).toContain('Optional AutoLegend hint')
    expect(description('label')).toContain('zero natural size')
    expect(description('onPress')).toContain('Optional callback')
    expect(description('onPress')).toContain('full key name and modifiers')
    expect(description('ref')).toContain('underlying Core HotKey')
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact deterministic public sample',
    async framework => {
      const moduleUrl = sampleUrl(framework)
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(hotkeyExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|tui-|setTimeout|setInterval|Math.random|Date.now|\.\.\//,
      )
      expect(source).toContain('event.full')
      if (framework === 'core') {
        expect(source).toContain('width: 48')
        expect(source).toContain('height: 3')
        expect(source).toContain("hotKey: 'x'")
        expect(source).toContain("hotKey: {char: 'r', ctrl: true}")
        expect(source).toContain("label: 'Count'")
        expect(source).toContain("label: 'Reset'")
        expect(source).toContain('new HotKey({')
        expect(source).toContain('summary.text =')
        expect(source).toContain('await Screen.start(view)')
      } else {
        expect(source).toContain('<Stack.down width={48} height={3}>')
        expect(source).toContain('<HotKey')
        expect(source).toContain('hotKey="x"')
        expect(source).toContain("hotKey={{char: 'r', ctrl: true}}")
        expect(source).toContain('label="Count"')
        expect(source).toContain('label="Reset"')
        expect(source).toContain('useState')
        expect(source).toContain('await run(<App />)')
        expect(source).not.toContain('createElement')
        expect(source).not.toContain("from '@teaui/core'")
      }

      const originalStart = Screen.start
      const captureSpy = vi.spyOn(capture, 'captureExample')
      const stopSpy = vi.spyOn(Screen.prototype, 'stop')
      const output = await hotkeyExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(stopSpy).toHaveBeenCalledOnce()
      expect(Screen.start).toBe(originalStart)
      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(lines.slice(0, 3).map(line => line.trimEnd())).toEqual([
        'HotKey registers without drawing',
        'Press x to count; Ctrl+R to reset',
        'Count: 0 | Last key: none',
      ])
      expect(text).toMatchSnapshot()
      expect(await hotkeyExample.render[framework]()).toBe(output)
      expect(captureSpy).toHaveBeenNthCalledWith(2, moduleUrl, SIZE)
    },
  )

  it('renders identical Core and public-wrapper React text', async () => {
    // The capture helper temporarily replaces Screen.start, so run sequentially.
    const core = await hotkeyExample.render.core()
    const react = await hotkeyExample.render.react()
    expect(removeAnsi(react)).toBe(removeAnsi(core))
  })

  it.each(['core', 'react'] as const)(
    '%s sample handles string and object shortcuts with no focused control',
    async framework => {
      const runtime: {program?: HeadlessProgram; screen?: Screen} = {}
      const start = async (view: View = new Window()) => {
        const program = new HeadlessProgram({
          cols: SIZE.width,
          rows: SIZE.height,
        })
        const screen = new Screen(program, view, {isFocused: false})
        runtime.program = program
        runtime.screen = screen
        screen.start()
        return [screen, program, view]
      }
      vi.spyOn(Screen, 'start').mockImplementation(
        start as unknown as typeof Screen.start,
      )

      try {
        // Execute the displayed sample, not a separately reconstructed view.
        const url = sampleUrl(framework)
        url.searchParams.set('test', 'keyboard-interaction')
        await import(url.href)
        const {screen, program} = runtime
        if (!screen || !program) {
          throw new Error('Sample did not start a screen')
        }
        expect(screen.currentFocusView).toBeUndefined()
        expect(screen.hotKeyViews).toHaveLength(2)
        expect(
          screen.hotKeyViews.map(([view]) => (view as HotKey).label),
        ).toEqual(['Count', 'Reset'])
        for (const [view] of screen.hotKeyViews) {
          expect(view).toBeInstanceOf(HotKey)
          expect(view.naturalSize(new Size(SIZE.width, SIZE.height))).toEqual(
            Size.zero,
          )
        }

        const initial = program.terminal.output
        // Both the character and modifier set must match exactly.
        for (const event of [key('y'), key('r'), key('x', true)]) {
          screen.dispatch(event)
          expect(program.terminal.output).toBe(initial)
        }
        screen.dispatch(key('x'))
        expect(removeAnsi(program.terminal.output)).toContain(
          'Count: 1 | Last key: x',
        )
        screen.dispatch(key('x'))
        expect(removeAnsi(program.terminal.output)).toContain(
          'Count: 2 | Last key: x',
        )
        expect(removeAnsi(program.terminal.output)).toMatchSnapshot('counted')
        screen.dispatch(key('r', true))
        expect(removeAnsi(program.terminal.output)).toContain(
          'Count: 0 | Last key: C-r',
        )
        expect(removeAnsi(program.terminal.output)).toMatchSnapshot('reset')
        screen.dispatch(key('x'))
        expect(removeAnsi(program.terminal.output)).toContain(
          'Count: 1 | Last key: x',
        )
        expect(screen.currentFocusView).toBeUndefined()
      } finally {
        runtime.screen?.stop()
      }
    },
  )
})

function sampleUrl(framework: 'core' | 'react'): URL {
  return new URL(
    `../lib/examples/samples/hotkey.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
    import.meta.url,
  )
}

function key(name: KeyEvent['name'], ctrl = false): KeyEvent {
  return {
    type: 'key',
    name,
    char: name,
    full: `${ctrl ? 'C-' : ''}${name}`,
    ctrl,
    alt: false,
    gui: false,
    shift: false,
  }
}
