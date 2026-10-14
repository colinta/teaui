import {existsSync, readFileSync} from 'node:fs'
import {lineWidth, removeAnsi, Screen, TestTerminal} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {legendExample} from '../lib/examples/samples/legend.js'

const SIZE = {width: 48, height: 8}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('legend CLI component example', () => {
  it('documents explicit items, inherited layout and palette, and the React ref', () => {
    expect(legendExample.name).toBe('legend')
    expect(legendExample.availability).toBe('both')
    expect(legendExample.description).toContain('hints do not bind shortcuts')
    expect(
      legendExample.props.map(({name, type, availability}) => ({
        name,
        type,
        availability,
      })),
    ).toEqual([
      {name: 'items', type: 'LegendItem[]', availability: 'both'},
      {name: 'purpose', type: 'Palette | Purpose', availability: 'both'},
      {
        name: 'width',
        type: "number | 'fill' | 'shrink' | 'natural'",
        availability: 'both',
      },
      {
        name: 'height',
        type: "number | 'fill' | 'shrink' | 'natural'",
        availability: 'both',
      },
      {name: 'ref', type: 'React.Ref<Legend>', availability: 'react'},
    ])
    const items = legendExample.props.find(prop => prop.name === 'items')
    expect(items?.description).toContain('Required array')
    expect(items?.description).toContain('key: string | string[]')
    expect(items?.description).toContain('slash-separated keys')
    expect(items?.description).toContain('modifier strings such as C-c')
    expect(items?.description).toContain('empty array draws nothing')
    expect(legendExample.props.some(prop => prop.name === 'children')).toBe(
      false,
    )
    expect(legendExample.props.some(prop => prop.name === 'onChange')).toBe(
      false,
    )
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact deterministic public sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/legend.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const executable = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(legendExample.source[framework]()).toBe(executable)
      expect(executable).toContain(`from '@teaui/${framework}'`)
      expect(executable).not.toMatch(
        /captureExample|HeadlessProgram|tui-|setTimeout|setInterval|Math.random|Date.now|\.\.\//,
      )
      expect(executable).toContain("{key: ['up', 'down'], label: 'Move'}")
      expect(executable).toContain("{key: 'C-c', label: 'Quit'}")
      if (framework === 'core') {
        expect(executable).toContain('width: 48')
        expect(executable).toContain('width: 24')
        expect(executable).toContain('height: 8')
        expect(executable).toContain("purpose: 'primary'")
        expect(executable).toContain('new Legend({items})')
        expect(executable).toContain('await Screen.start(view)')
      } else {
        expect(executable).toContain('await run(')
        expect(executable).toContain(
          '<Stack.down width={48} height={8} gap={1}>',
        )
        expect(executable).toContain('<Stack.down width={24}>')
        expect(executable).toContain('<Text>Keyboard hints (48 columns)</Text>')
        expect(executable).toContain('<Text>Wrapped (24 columns)</Text>')
        expect(executable).toContain('<Legend items={items} />')
        expect(executable).toContain(
          '<Legend items={items} purpose="primary" />',
        )
        expect(executable).not.toContain('createElement')
        expect(executable).not.toContain("from '@teaui/core'")
        expect(
          existsSync(
            new URL('../lib/examples/samples/legend.react.js', import.meta.url),
          ),
        ).toBe(false)
      }

      const originalStart = Screen.start
      const stopSpy = vi.spyOn(Screen.prototype, 'stop')
      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await legendExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(Screen.start).toBe(originalStart)
      expect(stopSpy).toHaveBeenCalledOnce()
      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(lines.map(line => line.trimEnd())).toEqual([
        'Keyboard hints (48 columns)',
        '↑/↓ Move   ⤦ Select   ␛ Cancel   ⇥ Switch',
        '⌃c Quit',
        '',
        'Wrapped (24 columns)',
        '↑/↓ Move   ⤦ Select',
        '␛ Cancel   ⇥ Switch',
        '⌃c Quit',
      ])
      expect(text).toMatchSnapshot()

      // Replay captured ANSI, rather than rendering a separate test-only view.
      const terminal = new TestTerminal({cols: SIZE.width, rows: SIZE.height})
      output.split('\n').forEach((line, y) => {
        terminal.move(0, y)
        terminal.write(line)
      })
      for (const row of [1, 2, 5, 6, 7]) {
        expect(terminal.styleAt(0, row).bold).toBe(true)
      }
      expect(terminal.styleAt(4, 1).bold === true).toBe(false)
      expect(terminal.styleAt(4, 5).bold === true).toBe(false)
      expect(terminal.styleAt(0, 5).foreground).not.toEqual(
        terminal.styleAt(0, 1).foreground,
      )
      expect(terminal.styleAt(0, 5).foreground).not.toEqual(
        terminal.styleAt(4, 5).foreground,
      )
      expect(await legendExample.render[framework]()).toBe(output)
      expect(captureSpy).toHaveBeenNthCalledWith(2, moduleUrl, SIZE)
      expect(Screen.start).toBe(originalStart)
      expect(stopSpy).toHaveBeenCalledTimes(2)
    },
  )

  it('renders identical Core and public-wrapper React text', async () => {
    // Capture temporarily replaces Screen.start, so execute sequentially.
    // React Text containers can propagate styles to otherwise blank cells.
    const core = await legendExample.render.core()
    const react = await legendExample.render.react()
    expect(removeAnsi(react)).toBe(removeAnsi(core))
  })
})
