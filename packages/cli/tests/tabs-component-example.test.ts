import {readFileSync} from 'node:fs'
import {
  lineWidth,
  removeAnsi,
  Screen,
  Tabs,
  testRender,
  Text,
} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {tabsExample} from '../lib/examples/samples/tabs.js'

const SIZE = {width: 36, height: 10}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('tabs CLI component example', () => {
  it('documents selection, borders, and framework-specific section content', () => {
    expect(tabsExample.name).toBe('tabs')
    expect(tabsExample.availability).toBe('both')
    expect(
      tabsExample.props.map(({name, type, availability}) => ({
        name,
        type,
        availability,
      })),
    ).toEqual([
      {name: 'border', type: 'boolean', availability: 'both'},
      {name: 'selected', type: 'number', availability: 'both'},
      {name: 'width', type: 'Dimension', availability: 'both'},
      {name: 'height', type: 'Dimension', availability: 'both'},
      {name: 'child', type: 'View', availability: 'core'},
      {name: 'children', type: 'View[]', availability: 'core'},
      {name: 'children', type: 'React.ReactNode', availability: 'react'},
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
        type: 'React.Ref<InstanceType<typeof Tabs.Section>>',
        availability: 'react',
      },
    ])
    expect(
      tabsExample.props.find(prop => prop.name === 'border')?.description,
    ).toContain('defaults to true')
    expect(
      tabsExample.props.find(prop => prop.name === 'selected')?.description,
    ).toContain('defaults to 0')
    expect(
      tabsExample.props.find(prop => prop.name === 'selected')?.description,
    ).toContain('Clicks change it internally')
    for (const framework of ['core', 'react'] as const) {
      const names = tabsExample.props
        .filter(
          prop =>
            prop.availability === 'both' || prop.availability === framework,
        )
        .map(prop => prop.name)
      expect(new Set(names).size).toBe(names.length)
      expect(names.includes('child')).toBe(framework === 'core')
      expect(names.includes('Section.child')).toBe(framework === 'core')
      expect(names.includes('Section.ref')).toBe(framework === 'react')
      // Tabs has no onChange prop or typed parent-wrapper ref.
      expect(names).not.toContain('onChange')
      expect(names).not.toContain('ref')
    }
  })

  it('matches public defaults and supports title changes and selecting sections', () => {
    const tabs = new Tabs()
    expect(tabs.border).toBe(true)
    expect(tabs.selected).toBe(0)
    const first = tabs.addTab('Info', new Text('Information panel'))
    const second = new Tabs.Section({child: new Text('Settings panel')})
    expect(second.title).toBe('')
    second.title = 'Settings'
    tabs.addTab(second)
    expect(tabs.tabs).toEqual([first, second])

    const t = testRender(tabs, {width: 36, height: 4})
    expect(t.terminal.textContent()).toMatchSnapshot(
      'default bordered first tab',
    )
    t.sendMouse('mouse.button.down', {x: 11, y: 0})
    t.sendMouse('mouse.button.up', {x: 11, y: 0})
    t.tick(1000)
    expect(tabs.selected).toBe(1)
    expect(t.terminal.textContent()).toContain('Settings panel')
    expect(t.terminal.textContent()).not.toContain('Information panel')
    expect(t.terminal.textContent()).toMatchSnapshot('clicked second tab')

    tabs.border = false
    first.update({title: 'Overview'})
    tabs.select(0)
    t.render()
    t.tick(1000)
    expect(t.terminal.textContent()).toMatchSnapshot(
      'borderless renamed first tab',
    )
    tabs.update({border: false, selected: 1})
    t.render()
    t.tick(1000)
    expect(tabs.selected).toBe(1)
    expect(t.terminal.textContent()).toMatchSnapshot(
      'updated borderless second tab',
    )
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact deterministic executable sample',
    async framework => {
      const extension = framework === 'core' ? 'js' : 'tsx'
      const moduleUrl = new URL(
        `../lib/examples/samples/tabs.${framework}.${extension}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(tabsExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|tui-|setTimeout|setInterval|Math\.random|Date\./,
      )
      if (framework === 'core') {
        expect(source).toContain('Tabs.create(')
        expect(source).toContain('new Tabs.Section(')
        expect(source).toContain('borderless.addTab(')
        expect(source).toContain('border: true, selected: 1')
        expect(source).toContain('border: false, selected: 0')
        expect(source).toContain('await Screen.start(examples)')
      } else {
        expect(source).toContain('<Tabs.Section title="Settings">')
        expect(source).toContain('<Tabs border={true} selected={1}')
        expect(source).toContain('<Tabs border={false} selected={0}')
        expect(source).toContain('await run(<App />)')
        expect(source).not.toMatch(/createElement|from '@teaui\/core'/)
      }

      const start = Screen.start
      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await tabsExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(output).toBe(await captureSpy.mock.results[0].value)
      expect(Screen.start).toBe(start)

      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(text).toContain('Info')
      expect(text).toContain('Settings')
      expect(text).toContain('Help')
      expect(text).toContain('Overview')
      expect(text).toContain('Details')
      expect(text).toContain('Change your preferences.')
      expect(text).toContain('Welcome to TeaUI.')
      expect(text).not.toContain('Information panel')
      expect(text).not.toContain('Help panel')
      expect(text).not.toContain('More details here.')
      expect(text).toMatchSnapshot()
      // Capture temporarily replaces Screen.start; render sequentially.
      expect(await tabsExample.render[framework]()).toBe(output)
      expect(Screen.start).toBe(start)
    },
  )

  it('produces identical Core and public JSX wrapper output', async () => {
    expect(await tabsExample.render.react()).toBe(
      await tabsExample.render.core(),
    )
  })
})
