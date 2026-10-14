import {existsSync, readFileSync} from 'node:fs'
import {Page, Text, TestTerminal, lineWidth, removeAnsi} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {pageExample} from '../lib/examples/samples/page.js'
import * as capture from '../lib/examples/samples/capture.js'

const SIZE = {width: 36, height: 11}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('page CLI component example', () => {
  it('documents navigation and explicit or implicit section composition', () => {
    expect(pageExample.name).toBe('page')
    expect(pageExample.availability).toBe('both')
    expect(pageExample.description).toContain('PageUp, PageDown, Home, End')
    expect(
      pageExample.props.map(({name, type, availability}) => ({
        name,
        type,
        availability,
      })),
    ).toEqual([
      {name: 'activeIndex', type: 'number', availability: 'both'},
      {
        name: 'onChange',
        type: '(index: number) => void',
        availability: 'both',
      },
      {name: 'width', type: 'Dimension', availability: 'both'},
      {name: 'height', type: 'Dimension', availability: 'both'},
      {name: 'child', type: 'View', availability: 'core'},
      {name: 'children', type: 'View[]', availability: 'core'},
      {
        name: 'children',
        type: 'React.ReactNode',
        availability: 'react',
      },
      {name: 'ref', type: 'React.Ref<Page>', availability: 'react'},
      {name: 'Section.title', type: 'string', availability: 'both'},
      {name: 'Section.child', type: 'View', availability: 'core'},
      {name: 'Section.children', type: 'View[]', availability: 'core'},
      {
        name: 'Section.children',
        type: 'React.ReactNode',
        availability: 'react',
      },
      {
        name: 'Section.ref',
        type: 'React.Ref<InstanceType<typeof Page.Section>>',
        availability: 'react',
      },
    ])
    for (const framework of ['core', 'react'] as const) {
      const props = pageExample.props.filter(
        prop => prop.availability === 'both' || prop.availability === framework,
      )
      expect(new Set(props.map(prop => prop.name)).size).toBe(props.length)
    }
    const description = (name: string) =>
      pageExample.props.find(prop => prop.name === name)?.description
    expect(description('activeIndex')).toContain('default 0')
    expect(description('activeIndex')).toContain('clamps to existing sections')
    expect(description('activeIndex')).toContain('after sections are attached')
    expect(description('onChange')).toContain('not when the slide finishes')
    expect(description('Section.title')).toContain("first child's heading")
    expect(description('Section.title')).toContain('empty string suppresses')
    expect(description('Section.title')).toContain('adds a title row')
  })

  it('matches the public section title and clamped navigation contracts', () => {
    const child = new Text({heading: 'Fallback', text: 'Body'})
    const fallback = new Page.Section({child})
    const suppressed = new Page.Section({
      title: '',
      child: new Text({heading: 'Fallback', text: 'Body'}),
    })
    expect(fallback.title).toBe('Fallback')
    expect(suppressed.title).toBe('')
    fallback.title = 'Explicit'
    expect(fallback.title).toBe('Explicit')

    const onChange = vi.fn()
    const page = Page.create(
      [
        ['First', new Text({text: 'First'})],
        new Page.Section({
          child: new Text({heading: 'Second', text: 'Second'}),
        }),
      ],
      {onChange},
    )
    page.add(new Text({heading: 'Implicit', text: 'Third'}))
    expect(page.sections.map(section => section.title)).toEqual([
      'First',
      'Second',
      'Implicit',
    ])
    expect(page.activeIndex).toBe(0)
    expect(onChange).not.toHaveBeenCalled()
    page.activeIndex = 99
    expect(page.activeIndex).toBe(2)
    expect(onChange.mock.calls).toEqual([[2]])
    page.receiveTick(1000)
    expect(onChange.mock.calls).toEqual([[2]])
    page.activeIndex = 2
    expect(onChange.mock.calls).toEqual([[2]])
    page.activeIndex = -99
    expect(page.activeIndex).toBe(0)
    expect(onChange.mock.calls).toEqual([[2], [0]])
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact deterministic executable sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/page.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(pageExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|tui-|setTimeout|setInterval|Math.random|Date.now|\.\.\//,
      )
      expect(source).toContain('activeIndex = 1')
      expect(source).toContain('receiveTick(1000)')
      expect(source).toContain('screen.render()')
      if (framework === 'core') {
        expect(source).toContain('width: 36')
        expect(source).toContain('height: 11')
        expect(source).toContain('height: 6')
        expect(source).toContain('height: 4')
        expect(source).toContain("title: 'Overview'")
        expect(source).toContain("heading: 'Details'")
        expect(source).toContain("title: ''")
        expect(source.match(/new Page.Section\(/g)).toHaveLength(3)
        expect(source).toContain('await Screen.start(examples)')
        expect(source).toContain('titled.activeIndex = 1')
      } else {
        expect(source).toContain('width={36}')
        expect(source).toContain('height={11}')
        expect(source).toContain('height={6}')
        expect(source).toContain('height={4}')
        expect(source).toContain('<Page.Section title="Overview">')
        expect(source).toContain('<Text heading="Details">')
        expect(source).toContain('<Page.Section title="">')
        expect(source.match(/<Page.Section(?:\s|>)/g)).toHaveLength(3)
        expect(source).toContain('await run(')
        expect(source).toContain('ref: titled')
        expect(source).toContain('createRef<PageView>()')
        expect(source).toContain('titled.current.activeIndex = 1')
        expect(source).toContain(
          "import type {Page as PageView} from '@teaui/core'",
        )
        expect(source).not.toContain('createElement')
        expect(
          existsSync(
            new URL('../lib/examples/samples/page.react.js', import.meta.url),
          ),
        ).toBe(false)
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await pageExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(lines.map(line => line.trim())).toEqual([
        'Title falls back to child heading',
        'PageUp / PageDown changes section',
        'Home / End jumps to an edge',
        '',
        'Details',
        '○  ●  ○',
        '',
        'Untitled pages: dots without a title',
        '',
        '',
        '●  ○',
      ])
      expect(text).not.toContain('(inactive)')
      expect(text).not.toContain('Overview')
      expect(text).not.toContain('Hidden title')
      expect(text).toMatchSnapshot()

      // Replay the captured ANSI to verify selected and unselected dot styles.
      const terminal = new TestTerminal({cols: SIZE.width, rows: SIZE.height})
      output.split('\n').forEach((line, y) => {
        terminal.move(0, y)
        terminal.write(line)
      })
      expect(terminal.styleAt(17, 5).bold).toBe(true)
      expect(terminal.styleAt(14, 5).dim).toBe(true)
      expect(terminal.styleAt(20, 5).dim).toBe(true)
      expect(terminal.styleAt(16, 10).bold).toBe(true)
      expect(terminal.styleAt(19, 10).dim).toBe(true)
      expect(await pageExample.render[framework]()).toBe(output)
      expect(captureSpy).toHaveBeenNthCalledWith(2, moduleUrl, SIZE)
    },
  )

  it('produces identical Core and public-wrapper React captures', async () => {
    // Captures replace Screen.start temporarily and must run sequentially.
    const core = await pageExample.render.core()
    const react = await pageExample.render.react()
    expect(react).toBe(core)
  })
})
