import {existsSync, readFileSync} from 'node:fs'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {lineWidth, removeAnsi, TestTerminal} from '@teaui/core'

import {inputExample} from '../lib/examples/samples/input.js'
import * as capture from '../lib/examples/samples/capture.js'

const SIZE = {width: 36, height: 19}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('input CLI component example', () => {
  it('documents editing and display props without implying multiline submission', () => {
    expect(inputExample.name).toBe('input')
    expect(inputExample.availability).toBe('both')

    for (const framework of ['core', 'react'] as const) {
      const props = inputExample.props.filter(
        prop => prop.availability === 'both' || prop.availability === framework,
      )
      const names = props.map(prop => prop.name)
      expect(names).toEqual([
        'value',
        'placeholder',
        'wrap',
        'multiline',
        'font',
        'format',
        'secret',
        'onChange',
        'onSubmit',
        'purpose',
        'width',
        'height',
        ...(framework === 'react' ? ['ref'] : []),
      ])
      expect(new Set(names).size).toBe(names.length)
      for (const name of ['child', 'children', 'title', 'hotKey', 'password']) {
        expect(names).not.toContain(name)
      }
      const prop = (name: string) => props.find(prop => prop.name === name)
      expect(prop('value')?.type).toBe('string')
      expect(prop('value')?.description).toContain('Newlines become spaces')
      expect(prop('placeholder')?.description).toContain(
        'only when value is empty',
      )
      expect(prop('wrap')?.type).toBe('boolean')
      expect(prop('wrap')?.description).toContain('Independent of multiline')
      expect(prop('multiline')?.type).toBe('boolean')
      expect(prop('multiline')?.description).toContain('instead of submitting')
      expect(prop('font')?.type).toBe('FontFamily')
      expect(prop('format')?.type).toBe('(text: string) => string')
      expect(prop('format')?.description).toContain(
        'same text with SGR escapes',
      )
      expect(prop('format')?.description).toContain(
        'not applied to the placeholder',
      )
      expect(prop('secret')?.type).toBe('boolean')
      expect(prop('secret')?.description).toContain('value stays the real text')
      expect(prop('onChange')?.type).toBe('(text: string) => void')
      expect(prop('onChange')?.description).toContain('paste and undo/redo')
      expect(prop('onSubmit')?.type).toBe('(text: string) => void')
      expect(prop('onSubmit')?.description).toContain(
        'only when multiline is false',
      )
      expect(prop('purpose')?.type).toBe('Palette | Purpose')
      for (const name of ['width', 'height']) {
        expect(prop(name)?.type).toBe('Dimension')
      }
    }
    expect(inputExample.props.find(prop => prop.name === 'ref')).toEqual({
      name: 'ref',
      type: 'React.Ref<Input>',
      description: 'Reference to the underlying Core Input',
      availability: 'react',
    })
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact deterministic public sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/input.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(inputExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|tui-|setTimeout|setInterval|Math\.random|Date\./,
      )
      if (framework === 'core') {
        for (const snippet of [
          'width: 36',
          'height: 19',
          'secret: true',
          'width: 24',
          'height: 2',
          'wrap: true',
          'multiline: true',
          "placeholder: 'Type a note...'",
          "font: 'double-struck'",
          'format: text =>',
          'onChange:',
          'onSubmit:',
        ]) {
          expect(source).toContain(snippet)
        }
        expect(source).toContain('await Screen.start(examples)')
        expect(source).toContain('status.text = `Submitted: ${value}`')
      } else {
        for (const snippet of [
          "import React, {useState} from 'react'",
          '<Stack.down width={36} height={19}>',
          'secret',
          '<Input',
          '<Text>{status}</Text>',
          'width={24}',
          'height={2}',
          'wrap',
          'multiline',
          'placeholder="Type a note..."',
          'font="double-struck"',
          'format={text =>',
          'onChange={value =>',
          'onSubmit={value =>',
          'await run(<App />)',
        ]) {
          expect(source).toContain(snippet)
        }
        expect(source).not.toContain('createElement')
        expect(
          existsSync(
            new URL('../lib/examples/samples/input.react.js', import.meta.url),
          ),
        ).toBe(false)
        expect(source).toContain('setName(value)')
        expect(source).toContain('setStatus(`Submitted: ${value}`)')
        expect(source).not.toContain("from '@teaui/core'")
        for (const callback of [
          'setNote',
          'setWrapped',
          'setMultiline',
          'setFont',
          'setStyled',
          'setPassword',
        ]) {
          expect(source).toContain(`onChange={${callback}}`)
        }
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await inputExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(output).toBe(await captureSpy.mock.results[0].value)

      const rendered = removeAnsi(output)
      expect(rendered).toContain('TeaUI')
      expect(rendered).toContain('Ready')
      expect(rendered).toContain('Type a note...')
      expect(rendered).toContain('Wrapping keeps this one')
      expect(rendered).toContain('logical line.')
      expect(rendered).toContain('first line⤦')
      expect(rendered).toContain('second line')
      expect(rendered).toContain('𝕋𝕖𝕒𝕌𝕀 𝟙𝟚𝟛')
      expect(rendered).toContain('Styled text')
      expect(rendered).toContain('Secret (password)')
      expect(rendered).toContain('•••••••')
      expect(rendered).not.toContain('hunter2')
      const lines = rendered.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(rendered).toMatchSnapshot()

      const terminal = new TestTerminal({cols: SIZE.width, rows: SIZE.height})
      output.split('\n').forEach((line, y) => {
        terminal.move(0, y)
        terminal.write(line)
      })
      expect(terminal.styleOf('Styled text')?.bold).toBe(true)
      expect(terminal.styleOf('Styled text')?.foreground).toBe('cyan')
      expect(terminal.styleOf('Type a note...')?.bold).not.toBe(true)

      expect(await inputExample.render[framework]()).toBe(output)
      expect(captureSpy).toHaveBeenNthCalledWith(2, moduleUrl, SIZE)
    },
  )

  it('produces identical Core and public-wrapper React text', async () => {
    // Screen.start is temporarily replaced by captureExample: capture sequentially.
    const core = await inputExample.render.core()
    const react = await inputExample.render.react()
    expect(removeAnsi(react)).toBe(removeAnsi(core))
  })
})
