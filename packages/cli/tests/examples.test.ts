import {existsSync, readFileSync} from 'node:fs'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {removeAnsi} from '@teaui/core'
import {expandCommandAbbreviation} from '../lib/commandAbbreviation.js'
import {EXAMPLES, listExamples, showExample} from '../lib/examples.js'
import * as capture from '../lib/examples/samples/capture.js'
import {COMPONENTS} from '../lib/examples/catalog.js'

function sampleSource(filename: string): string {
  return readFileSync(
    new URL(`../lib/examples/samples/${filename}`, import.meta.url),
    'utf8',
  )
    .trimEnd()
    .split('\n')
    .map(line => `  ${line}`)
    .join('\n')
}

describe('command abbreviations', () => {
  it('expands a unique command prefix', () => {
    const argv = ['node', 'teaui', 'ex', 'calendar']
    expandCommandAbbreviation(argv, ['example', 'create'])
    expect(argv[2]).toBe('example')
  })

  it('does not expand an ambiguous command prefix', () => {
    const argv = ['node', 'teaui', 'ex']
    expandCommandAbbreviation(argv, ['example', 'export'])
    expect(argv[2]).toBe('ex')
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('component examples', () => {
  it('registers the complete catalog exactly once, alphabetically', () => {
    const names = EXAMPLES.map(example => example.name)
    expect(names).toEqual(COMPONENTS.map(component => component.name))
    expect(names).toEqual([...names].sort())
    expect(new Set(names).size).toBe(64)
    for (const example of EXAMPLES) {
      const frameworks =
        example.availability === 'both'
          ? ['core', 'react']
          : [example.availability]
      expect(Object.keys(example.source).sort()).toEqual(frameworks)
      expect(Object.keys(example.render).sort()).toEqual(frameworks)
      expect(
        COMPONENTS.find(component => component.name === example.name),
      ).toEqual({name: example.name, availability: example.availability})
    }
  })

  it.each(
    EXAMPLES.flatMap(example =>
      (['core', 'react'] as const)
        .filter(
          framework =>
            example.availability === 'both' ||
            example.availability === framework,
        )
        .map(framework => ({name: example.name, framework, example})),
    ),
  )(
    'shows the exact source and dispatches the $name ($framework) renderer',
    async ({name, framework, example}) => {
      const renderSpy = vi
        .spyOn(example.render, framework)
        .mockResolvedValue('sample output')
      const sourceSpy = vi.spyOn(example.source, framework)
      const tsxUrl = new URL(
        `../lib/examples/samples/${name}.${framework}.tsx`,
        import.meta.url,
      )
      const filename = `${name}.${framework}.${existsSync(tsxUrl) ? 'tsx' : 'js'}`
      const displayed = removeAnsi(await showExample(name, framework))
      expect(displayed).toContain(sampleSource(filename))
      expect(displayed).toContain('Output\n  sample output')
      expect(sourceSpy).toHaveBeenCalledExactlyOnceWith()
      expect(renderSpy).toHaveBeenCalledExactlyOnceWith()
    },
  )
  it('lists every component with its example status', () => {
    const all = listExamples()
    expect(all).toContain('Component examples (All):')
    expect(all).toContain('br')
    expect(all).not.toMatch(/^\s+(?:container|root)\s/m)

    const react = listExamples('react')
    expect(react).toContain('Component examples (React):')
    expect(react).toContain('accordion')
    expect(react).toMatch(/calendar\s+ready/)
    expect(react).not.toContain('calendar (cal)')
    expect(react).toMatch(/button\s+ready/)
    expect(all).not.toMatch(/\s+todo$/m)
    expect(react).not.toMatch(/\s+todo$/m)
    expect(all.match(/\s+ready$/gm)).toHaveLength(64)
    expect(react.match(/\s+ready$/gm)).toHaveLength(64)
    expect(react).toContain('br')
    expect(react).not.toMatch(/^\s+(?:container|root)\s/m)

    const core = listExamples('core')
    expect(core).toContain('Component examples (Core):')
    expect(core).not.toMatch(/^\s+(?:container|root)\s/m)
    expect(core).toContain('bar-chart')
    expect(core).not.toMatch(/^\s+(br|style)\s/m)
    expect(core).not.toMatch(/\s+todo$/m)
    expect(core.match(/\s+ready$/gm)).toHaveLength(62)
  })

  it('shows the props, runnable React source, and rendered output', async () => {
    const example = removeAnsi(await showExample('calendar', 'react'))

    expect(example).toContain('Prop')
    expect(example).toContain('Type')
    expect(example).toContain('Description')
    expect(example).toContain('selection?')
    expect(example).toContain("'single' | 'range'")
    expect(example).toContain('ref?')
    expect(example).toContain("import React, {useState} from 'react'")
    expect(example).toContain("import {Calendar, run} from '@teaui/react'")
    expect(example).toContain('await run(<App />)')
    expect(example).toContain(sampleSource('calendar.react.tsx'))
    expect(example).toContain(`Output
   ◃    June    2026  ▹`)
  })

  it('shows runnable Core source and its rendered output', async () => {
    const example = removeAnsi(await showExample('calendar', 'core'))

    expect(example).not.toContain('ref?')
    expect(example).toContain("import {Calendar, Screen} from '@teaui/core'")
    expect(example).toContain('await Screen.start(calendar)')
    expect(example).toContain(sampleSource('calendar.core.js'))
    expect(example).toContain(`Output
   ◃    June    2026  ▹`)
  })

  it.each(['calen', 'cald', 'caldar', 'CALENDAR'])(
    'fuzzy-matches %s to calendar',
    async query => {
      expect(await showExample(query, 'react')).toBe(
        await showExample('calendar', 'react'),
      )
    },
  )

  it('reports newly ambiguous abbreviations with every match', async () => {
    await expect(showExample('cal')).rejects.toThrow(
      'Ambiguous component: cal\nMatches: calendar, callout',
    )
  })

  it.each(['br', 'style'])(
    'rejects the unsupported Core framework for %s without capture or fuzzy fallback',
    async name => {
      const captureSpy = vi.spyOn(capture, 'captureExample')
      await expect(showExample(name, 'core')).rejects.toThrow(
        `Unknown component: ${name}`,
      )
      expect(captureSpy).not.toHaveBeenCalled()
    },
  )

  it('checks missing handlers before displaying or rendering an example', async () => {
    const example = EXAMPLES.find(example => example.name === 'button')!
    const core = example.render.core!
    vi.spyOn(example, 'render', 'get').mockReturnValue({core})
    await expect(showExample('button')).rejects.toThrow(
      'Example unavailable for react: button',
    )
    expect(listExamples('react')).toMatch(/button\s+todo/)
  })

  it('reports an unknown component with the component list', async () => {
    await expect(showExample('missing')).rejects.toThrow(
      'Unknown component: missing\n\nComponent examples (React):',
    )
  })
})
