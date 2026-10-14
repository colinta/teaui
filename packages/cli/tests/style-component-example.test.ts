import {readFileSync} from 'node:fs'
import {lineWidth, removeAnsi, TestTerminal} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {styleExample} from '../lib/examples/samples/style.js'

const SIZE = {width: 56, height: 5}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('style CLI component example', () => {
  it('documents React-only inline styling without Core handlers or block text props', () => {
    expect(styleExample.name).toBe('style')
    expect(styleExample.availability).toBe('react')
    expect(styleExample.description).toContain('nested inheritance')
    expect(styleExample.description).toContain(
      'use Text for font, alignment, and wrapping',
    )
    expect(Object.keys(styleExample.source)).toEqual(['react'])
    expect(Object.keys(styleExample.render)).toEqual(['react'])
    expect(
      styleExample.props.map(({name, type, availability}) => ({
        name,
        type,
        availability,
      })),
    ).toEqual([
      {name: 'bold', type: 'boolean', availability: 'react'},
      {name: 'dim', type: 'boolean', availability: 'react'},
      {name: 'italic', type: 'boolean', availability: 'react'},
      {name: 'underline', type: 'boolean', availability: 'react'},
      {name: 'strikeout', type: 'boolean', availability: 'react'},
      {name: 'inverse', type: 'boolean', availability: 'react'},
      {name: 'blink', type: 'boolean', availability: 'react'},
      {name: 'invisible', type: 'boolean', availability: 'react'},
      {name: 'foreground', type: 'Color', availability: 'react'},
      {name: 'background', type: 'Color', availability: 'react'},
      {name: 'link', type: 'string', availability: 'react'},
      {name: 'linkParams', type: 'string', availability: 'react'},
      {name: 'style', type: 'Partial<Style>', availability: 'react'},
      {name: 'children', type: 'React.ReactNode', availability: 'react'},
      {
        name: 'ref',
        type: 'React.Ref<React.ComponentRef<typeof Style>>',
        availability: 'react',
      },
    ])
    const description = (name: string) =>
      styleExample.props.find(prop => prop.name === name)!.description
    expect(description('bold')).toContain('false disables an inherited flag')
    expect(description('dim')).toContain('mutually exclusive with bold')
    expect(description('style')).toContain('object fields take precedence')
    expect(description('link')).toContain('empty string ends an inherited link')
    expect(description('blink')).toContain('does not emit blink codes')
    expect(description('invisible')).toContain('does not emit conceal codes')
    for (const name of ['font', 'alignment', 'wrap', 'strikethrough']) {
      expect(styleExample.props.map(prop => prop.name)).not.toContain(name)
    }
  })

  it('displays and captures the exact deterministic executable public JSX sample', async () => {
    const moduleUrl = new URL(
      '../lib/examples/samples/style.react.tsx',
      import.meta.url,
    )
    const source = readFileSync(moduleUrl, 'utf8').trimEnd()
    expect(styleExample.source.react()).toBe(source)
    expect(source).toContain("import React from 'react'")
    expect(source).toContain(
      "import {Stack, Style, Text, run} from '@teaui/react'",
    )
    expect(source).toContain('<Style bold>bold</Style>')
    expect(source).toContain('<Style bold={false} foreground="cyan">')
    expect(source).toContain('<Style bold style={objectStyle}>')
    expect(source).toContain('await run(<App />)')
    expect(source).not.toMatch(
      /captureExample|HeadlessProgram|tui-|createElement|setTimeout|setInterval|Math.random|Date.now|from '@teaui\/core'|\.\.\//,
    )

    const captureSpy = vi.spyOn(capture, 'captureExample')
    const output = await styleExample.render.react()
    expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
    const text = removeAnsi(output)
    const lines = text.split('\n')
    expect(lines).toHaveLength(SIZE.height)
    expect(lines.map(line => lineWidth(line))).toEqual(
      Array(SIZE.height).fill(SIZE.width),
    )
    expect(lines.map(line => line.trimEnd())).toEqual([
      'Inline: plain bold italic underlined struck',
      'Nested: outer nested override restored plain',
      'Object: object wins plain',
      'Flags: dim inverse bold wins dim wins plain',
      'Link: TeaUI plain',
    ])
    expect(text).toMatchSnapshot()

    const terminal = new TestTerminal({cols: SIZE.width, rows: SIZE.height})
    output.split('\n').forEach((line, y) => {
      terminal.move(0, y)
      terminal.write(line)
    })
    expect(terminal.styleOf('bold')?.bold).toBe(true)
    expect(terminal.styleOf('italic')?.italic).toBe(true)
    expect(terminal.styleOf('underlined')?.underline).toBe(true)
    expect(terminal.styleOf('struck')?.strikeout).toBe(true)
    for (const label of ['outer', 'nested', 'restored']) {
      expect(terminal.styleOf(label)?.bold).toBe(true)
      expect(terminal.styleOf(label)?.foreground).toEqual([255, 170, 0])
    }
    expect(terminal.styleOf('nested')?.italic).toBe(true)
    expect(terminal.styleOf('restored')?.italic).not.toBe(true)
    expect(terminal.styleOf('override')?.bold).not.toBe(true)
    expect(terminal.styleOf('override')?.foreground).not.toEqual([255, 170, 0])
    expect(terminal.styleOf('object wins')?.bold).not.toBe(true)
    expect(terminal.styleOf('object wins')?.underline).toBe(true)
    expect(terminal.styleOf('object wins')?.foreground).toEqual([0, 255, 136])
    expect(terminal.styleOf('object wins')?.background).toEqual([32, 32, 64])
    expect(terminal.styleOf('dim')?.dim).toBe(true)
    expect(terminal.styleOf('inverse')?.inverse).toBe(true)
    expect(terminal.styleOf('bold wins')?.bold).toBe(true)
    expect(terminal.styleOf('bold wins')?.dim).not.toBe(true)
    expect(terminal.styleOf('dim wins')?.dim).toBe(true)
    expect(terminal.styleOf('dim wins')?.bold).not.toBe(true)
    expect(terminal.styleOf('TeaUI')?.underline).toBe(true)
    expect(terminal.styleOf('TeaUI')?.link).toBe('https://example.com/teaui')
    expect(terminal.styleOf('TeaUI')?.linkParams).toBe('id=style-example')
    // Styling and links end at the inline boundary, including the final row.
    for (let y = 0; y < lines.length; y++) {
      const x = lines[y].lastIndexOf('plain')
      if (x < 0) {
        continue
      }
      const style = terminal.styleAt(x, y)
      expect(style?.bold).not.toBe(true)
      expect(style?.dim).not.toBe(true)
      expect(style?.inverse).not.toBe(true)
      expect(style?.italic).not.toBe(true)
      expect(style?.underline).not.toBe(true)
      expect(style?.strikeout).not.toBe(true)
      expect(style?.link).toBeFalsy()
      expect(style?.background).not.toEqual([32, 32, 64])
    }
    expect(await styleExample.render.react()).toBe(output)
    expect(captureSpy).toHaveBeenNthCalledWith(2, moduleUrl, SIZE)
  })
})
