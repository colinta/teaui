import {readFileSync} from 'node:fs'
import {lineWidth, removeAnsi} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {placementExample} from '../lib/examples/samples/placement.js'
import * as capture from '../lib/examples/samples/capture.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('placement CLI component example', () => {
  it('documents edge coordinates and only supported Placement props', () => {
    expect(placementExample.name).toBe('placement')
    expect(placementExample.availability).toBe('both')
    expect(
      placementExample.props.map(({name, type, availability}) => ({
        name,
        type,
        availability,
      })),
    ).toEqual([
      {
        name: 'top',
        type: 'number | VerticalCoordinate',
        availability: 'both',
      },
      {
        name: 'right',
        type: 'number | HorizontalCoordinate',
        availability: 'both',
      },
      {
        name: 'bottom',
        type: 'number | VerticalCoordinate',
        availability: 'both',
      },
      {
        name: 'left',
        type: 'number | HorizontalCoordinate',
        availability: 'both',
      },
      {name: 'isVisible', type: 'boolean', availability: 'both'},
      {name: 'debug', type: 'boolean', availability: 'both'},
      {name: 'child', type: 'View', availability: 'core'},
      {name: 'children', type: 'View[]', availability: 'core'},
      {
        name: 'children',
        type: 'React.ReactNode',
        availability: 'react',
      },
      {name: 'ref', type: 'React.Ref<Placement>', availability: 'react'},
    ])
    expect(placementExample.description).toContain(
      'direct child of AlignmentScope',
    )
    expect(placementExample.description).toContain('unresolved points')
    for (const name of ['right', 'bottom']) {
      expect(
        placementExample.props.find(prop => prop.name === name)?.description,
      ).toContain('Exclusive')
      expect(
        placementExample.props.find(prop => prop.name === name)?.description,
      ).toContain('not an inset')
    }
    for (const prop of placementExample.props.filter(
      prop => prop.name === 'children',
    )) {
      expect(prop.description).toContain('size and padding props on')
    }
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures its exact executable sample at 40 by 8',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/placement.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const executable = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(placementExample.source[framework]()).toBe(executable)
      expect(executable).toContain(`from '@teaui/${framework}'`)
      expect(executable).not.toMatch(/captureExample|HeadlessProgram|tui-/)
      expect(executable).toContain(
        framework === 'core'
          ? 'right: anchor.left.minus(1)'
          : 'right={anchor.left.minus(1)}',
      )
      expect(executable).toContain(
        framework === 'core'
          ? 'bottom: anchor.top.plus(4)'
          : 'bottom={anchor.top.plus(4)}',
      )
      expect(executable).toContain(
        framework === 'core'
          ? 'await Screen.start(layout)'
          : 'await run(<App />)',
      )
      if (framework === 'react') {
        expect(executable).toContain("useAlignment('anchor')")
        expect(executable).not.toContain("from '@teaui/core'")
        expect(executable).not.toContain('createElement')
        expect(executable).toContain('<AlignmentScope width={40} height={8}>')
        expect(executable).toContain('<Placement>')
        expect(executable).toContain('<Stack.down>')
        expect(executable).toContain('<Alignment point={anchor} />')
        expect(executable).toContain(
          '<Text>Placement: edges, not insets</Text>',
        )
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await placementExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, {
        width: 40,
        height: 8,
      })
      // Screen.start is temporarily replaced during capture: render sequentially.
      expect(await placementExample.render[framework]()).toBe(output)
    },
  )

  it('renders the same filled, clipped and natural-sized rectangles in both frameworks', async () => {
    const core = await placementExample.render.core()
    const react = await placementExample.render.react()
    const text = removeAnsi(core)
    expect(removeAnsi(react)).toBe(text)

    const lines = text.split('\n')
    expect(lines).toHaveLength(8)
    expect(lines.map(line => lineWidth(line))).toEqual(Array(8).fill(40))
    // No edges: natural size, origin (0, 0).
    expect(lines[0].trimEnd()).toBe('Placement: edges, not insets')
    expect(lines[1].trim()).toBe('')
    // Both edges: [1, 27) x [2, 6); a one-cell gap before the anchor.
    expect(lines[2].slice(1, 27)).toBe(`┌${'─'.repeat(24)}┐`)
    expect(lines[5].slice(1, 27)).toBe(`└${'─'.repeat(24)}┘`)
    expect(lines[3].slice(1, 27)).toBe('│Both edges fill.        │')
    expect(lines[4].slice(1, 27)).toBe('│Children are clipped.   │')
    expect(lines[2][27]).toBe(' ')
    expect(lines[2].slice(28, 36)).toBe('┌──────┐')
    expect(lines[3].slice(28, 36)).toBe('│Anchor│')
    expect(lines[4].slice(28, 36)).toBe('└──────┘')
    expect(text).not.toContain('Not shown')
    // Leading edges only: natural-sized label at (28, 6).
    expect(lines[6].trim()).toBe('Leading')
    expect(lines[6].indexOf('Leading')).toBe(28)
    // Trailing edges only: label ends at exclusive x=27 and y=8.
    expect(lines[7].trim()).toBe('Trailing edges')
    expect(lines[7].indexOf('Trailing edges')).toBe(
      27 - 'Trailing edges'.length,
    )
    expect(lines[7].slice(27).trim()).toBe('')
    expect(text).toMatchSnapshot()
  })
})
