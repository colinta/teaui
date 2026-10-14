import {readFileSync} from 'node:fs'
import {Scrollable, Text, View, lineWidth, removeAnsi} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {scrollableExample} from '../lib/examples/samples/scrollable.js'

const SIZE = {width: 40, height: 17}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('scrollable CLI component example', () => {
  it('documents layout, scrolling, overrides, and framework-specific props accurately', () => {
    expect(scrollableExample.name).toBe('scrollable')
    expect(scrollableExample.availability).toBe('both')
    expect(scrollableExample.description).toContain('after layout')

    const common = [
      'direction',
      'gap',
      'scrollable',
      'showScrollbars',
      'keepAtBottom',
      'contentSize',
      'offset',
      'onOffsetChange',
      'width',
      'height',
    ]
    for (const framework of ['core', 'react'] as const) {
      const props = scrollableExample.props.filter(
        prop => prop.availability === 'both' || prop.availability === framework,
      )
      const names = props.map(prop => prop.name)
      expect(new Set(names).size).toBe(names.length)
      expect(names).toEqual([
        ...common,
        ...(framework === 'core' ? ['child', 'children'] : ['children', 'ref']),
      ])
      const prop = (name: string) => props.find(prop => prop.name === name)!
      expect(prop('direction').type).toBe("'down' | 'up' | 'left' | 'right'")
      expect(prop('direction').description).toContain('defaults to down')
      expect(prop('direction').description).toContain('not the scrolling')
      expect(prop('gap').type).toBe('number')
      expect(prop('gap').description).toContain('defaults to 0')
      expect(prop('scrollable').type).toBe("'both' | 'horizontal' | 'vertical'")
      expect(prop('scrollable').description).toContain('defaults to both')
      expect(prop('showScrollbars').type).toBe(
        "boolean | 'horizontal' | 'vertical'",
      )
      for (const text of [
        'Defaults to true',
        'false hides both',
        'overflow in allowed axes',
        'one row or column',
      ]) {
        expect(prop('showScrollbars').description).toContain(text)
      }
      expect(prop('keepAtBottom').type).toBe('boolean')
      expect(prop('keepAtBottom').description).toContain('Defaults to false')
      expect(prop('keepAtBottom').description).toContain('while already there')
      expect(prop('contentSize').type).toBe('{width?: number; height?: number}')
      expect(prop('contentSize').description).toContain(
        'omitted axes use the viewport size',
      )
      expect(prop('offset').type).toBe('Point')
      expect(prop('offset').description).toContain('positive right/down')
      expect(prop('onOffsetChange').type).toBe('(offset: Point) => void')
      expect(prop('onOffsetChange').description).toContain('not emitted')
      expect(prop('onOffsetChange').description).toContain('scrollbar dragging')
      expect(prop('width').type).toBe('Dimension')
      expect(prop('height').type).toBe('Dimension')
      expect(prop('children').type).toBe(
        framework === 'core' ? 'View[]' : 'React.ReactNode',
      )
      if (framework === 'core') {
        expect(prop('child').type).toBe('View')
        expect(prop('child').description).toContain('appended after')
      } else {
        expect(prop('ref').type).toBe('React.Ref<Scrollable>')
        expect(prop('ref').description).toContain('rather than setting')
      }
    }

    const scrollable = new Scrollable({})
    expect(scrollable.direction).toBe('down')
    expect(scrollable.gap).toBe(0)
    const first = new Text('First')
    const last = new Text('Last')
    expect(new Scrollable({children: [first], child: last}).children).toEqual([
      first,
      last,
    ])
  })

  it.each(['core', 'react'] as const)(
    '%s captures the exact executable sample and deterministic public scrolling APIs',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/scrollable.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(scrollableExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).not.toMatch(
        /createElement|captureExample|HeadlessProgram|testRender|tui-|setTimeout|setInterval|Math\.random|Date\./,
      )
      for (const [core, react] of [
        ["showScrollbars: 'vertical'", 'showScrollbars="vertical"'],
        ["showScrollbars: 'horizontal'", 'showScrollbars="horizontal"'],
        ['showScrollbars: true', 'showScrollbars={true}'],
        ['showScrollbars: false', 'showScrollbars={false}'],
        [
          'contentSize: {width: 60, height: 8}',
          'contentSize={{width: 60, height: 8}}',
        ],
        ['gap: 2', 'gap={2}'],
        ['screen.render()', 'screen.render()'],
      ]) {
        expect(source).toContain(framework === 'react' ? react : core)
      }
      if (framework === 'react') {
        expect(source).toContain("import React, {createRef} from 'react'")
        expect(source).toContain('await run(')
        expect(source).toContain(
          'createRef<React.ElementRef<typeof Scrollable.down>>()',
        )
        expect(source).toContain(
          'createRef<React.ElementRef<typeof Scrollable.right>>()',
        )
        expect(source).toContain('createRef<React.ElementRef<typeof Text>>()')
        expect(source).toContain('<Stack.down width={40} height={17}>')
        expect(source).toContain('<Scrollable.down')
        expect(source).toContain('<Scrollable.right')
        expect(source).toContain('<Scrollable\n')
        expect(source).toContain(
          '<Text key={index} ref={index === 6 ? target : undefined}>',
        )
        expect(source).not.toContain("from '@teaui/core'")
      } else {
        expect(source).toContain('await Screen.start(examples)')
        expect(source).toContain('Scrollable.down(')
        expect(source).toContain('Scrollable.right(')
        expect(source).toContain('new Scrollable(')
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const scrollBy = vi.spyOn(Scrollable.prototype, 'scrollBy')
      const scrollTo = vi.spyOn(Scrollable.prototype, 'scrollTo')
      const advancePage = vi.spyOn(Scrollable.prototype, 'advancePage')
      const output = await scrollableExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(await captureSpy.mock.results[0].value).toBe(output)
      expect(scrollBy.mock.calls).toEqual([
        [0, 2],
        [22, 0],
        [5, 2],
        [0, 3],
      ])
      expect(scrollTo).toHaveBeenCalledExactlyOnceWith(expect.any(View))
      expect(advancePage).toHaveBeenCalledExactlyOnceWith(1)
      // Calls operate on laid-out views, not zero-sized unmounted instances.
      for (const view of scrollBy.mock.contexts) {
        if (!(view instanceof Scrollable)) {
          throw new Error('Sample did not scroll a Scrollable view')
        }
        expect(view.contentSize.width).toBeGreaterThan(0)
        expect(view.contentSize.height).toBeGreaterThan(0)
      }

      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(text).toContain('Item 7: scroll to reveal')
      expect(text).not.toContain('Item 1: scroll to reveal')
      expect(text).toContain('Two: abcdefghijklmno')
      expect(text).toContain('Row 3: ABCDEFGHIJKLMNOPQRSTUVWXYZ')
      expect(text).not.toContain('Row 1:')
      expect(lines.slice(1, 5).map(line => line.at(-1))).toEqual([
        ' ',
        '█',
        '█',
        ' ',
      ])
      expect(lines[7]).toContain('█')
      expect(lines[12]).toContain('█')
      expect(lines[12].at(-1)).toBe('█')
      expect(lines.slice(14).map(line => line.trimEnd())).toEqual([
        'Quiet item 3',
        'Quiet item 4',
        'Quiet item 5',
      ])
      expect(lines.slice(14).join('\n')).not.toContain('█')
      expect(text).toMatchSnapshot('text and scrollbars')
      expect(output).toMatchSnapshot('exact styled capture')
      expect(await scrollableExample.render[framework]()).toBe(output)
    },
  )

  it('produces identical Core and public-wrapper React text and scrollbars', async () => {
    // captureExample overrides Screen.start; captures must remain sequential.
    const core = await scrollableExample.render.core()
    const react = await scrollableExample.render.react()
    // TextProvider can emit a redundant reset; compare the visible output.
    expect(removeAnsi(react)).toBe(removeAnsi(core))
  })
})
