import {existsSync, readFileSync} from 'node:fs'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {lineWidth, removeAnsi, Screen} from '@teaui/core'

import {autoLegendExample} from '../lib/examples/samples/auto-legend.js'

const SIZE = {width: 48, height: 4}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('auto-legend component example', () => {
  it('documents only inherited props and the public React ref', () => {
    expect(autoLegendExample.name).toBe('auto-legend')
    expect(autoLegendExample.availability).toBe('both')
    expect(autoLegendExample.description).toContain('focus changes')
    expect(
      autoLegendExample.props.map(({name, availability}) => ({
        name,
        availability,
      })),
    ).toEqual([
      {name: 'purpose', availability: 'both'},
      {name: 'width', availability: 'both'},
      {name: 'height', availability: 'both'},
      {name: 'ref', availability: 'react'},
    ])
    expect(
      autoLegendExample.props.find(({name}) => name === 'purpose')?.type,
    ).toBe('Palette | Purpose')
    for (const name of ['width', 'height']) {
      expect(
        autoLegendExample.props.find(prop => prop.name === name)?.type,
      ).toBe("number | 'fill' | 'shrink' | 'natural'")
    }
    expect(autoLegendExample.props.find(({name}) => name === 'ref')?.type).toBe(
      'React.Ref<AutoLegend>',
    )
    expect(autoLegendExample.props.some(({name}) => name === 'items')).toBe(
      false,
    )
    expect(autoLegendExample.props.some(({name}) => name === 'children')).toBe(
      false,
    )
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact runnable sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/auto-legend.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const executable = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(autoLegendExample.source[framework]()).toBe(executable)
      expect(executable).not.toMatch(/captureExample|HeadlessProgram|tui-/)
      expect(executable).toContain(`from '@teaui/${framework}'`)
      if (framework === 'react') {
        expect(executable).toContain('await run(')
        expect(executable).toContain(
          '<Stack.down width={48} height={4} gap={1}>',
        )
        expect(executable).toContain('<ZStack>')
        expect(executable).toContain('<Input value="Search docs" />')
        expect(executable).toContain('<HotKey hotKey="C-c" label="Quit" />')
        expect(executable).toContain('<AutoLegend />')
        expect(executable).not.toContain('createElement')
        expect(executable).not.toContain("from '@teaui/core'")
        expect(
          existsSync(
            new URL(
              '../lib/examples/samples/auto-legend.react.js',
              import.meta.url,
            ),
          ),
        ).toBe(false)
      } else {
        expect(executable).toContain('width: 48')
        expect(executable).toContain('height: 4')
        expect(executable).toContain('await Screen.start(view)')
        expect(executable).toContain('new AutoLegend()')
      }

      const originalStart = Screen.start
      const startSpy = vi.spyOn(Screen.prototype, 'start')
      const stopSpy = vi.spyOn(Screen.prototype, 'stop')
      const output = await autoLegendExample.render[framework]()
      expect(startSpy).toHaveBeenCalledOnce()
      expect(stopSpy).toHaveBeenCalledOnce()
      expect(Screen.start).toBe(originalStart)
      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(text).toContain('Search docs')
      expect(text).toContain('Line Start')
      expect(text).toContain('Undo')
      expect(text).toContain('Redo')
      expect(text).toContain('⌃c Quit')
      expect(text).toMatchSnapshot()
      expect(await autoLegendExample.render[framework]()).toBe(output)
    },
  )

  it('renders identical Core and public-wrapper React text', async () => {
    expect(removeAnsi(await autoLegendExample.render.react())).toBe(
      removeAnsi(await autoLegendExample.render.core()),
    )
  })

  it('restores Screen.start and stops capture when sample startup fails', async () => {
    const originalStart = Screen.start
    const error = new Error('Test startup failure')
    vi.spyOn(Screen.prototype, 'start').mockImplementationOnce(() => {
      throw error
    })
    const stopSpy = vi.spyOn(Screen.prototype, 'stop')

    await expect(autoLegendExample.render.core()).rejects.toBe(error)
    expect(Screen.start).toBe(originalStart)
    expect(stopSpy).toHaveBeenCalledOnce()
  })
})
