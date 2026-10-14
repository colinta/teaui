import {readFileSync} from 'node:fs'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {Drawer, Text, lineWidth, removeAnsi} from '@teaui/core'

import {drawerExample} from '../lib/examples/samples/drawer.js'
import * as capture from '../lib/examples/samples/capture.js'

const SIZE = {width: 32, height: 10}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('drawer CLI component example', () => {
  it('documents state changes, hidden handles, and framework-specific slots', () => {
    expect(drawerExample.name).toBe('drawer')
    expect(drawerExample.availability).toBe('both')

    for (const framework of ['core', 'react'] as const) {
      const props = drawerExample.props.filter(
        prop => prop.availability === 'both' || prop.availability === framework,
      )
      const names = props.map(prop => prop.name)
      expect(new Set(names).size).toBe(names.length)
      expect(names).toEqual([
        'location',
        'isOpen',
        'hidesWhenClosed',
        'onToggle',
        'hotKey',
        'title',
        'content',
        'drawer',
        'width',
        'height',
        ...(framework === 'core' ? ['child', 'children'] : ['children', 'ref']),
      ])
      expect(props.find(prop => prop.name === 'location')?.type).toBe(
        "'left' | 'right' | 'top' | 'bottom'",
      )
      expect(props.find(prop => prop.name === 'isOpen')).toEqual(
        expect.objectContaining({
          type: 'boolean',
          description: expect.stringContaining('Initial/reset'),
        }),
      )
      expect(props.find(prop => prop.name === 'hidesWhenClosed')).toEqual(
        expect.objectContaining({
          type: 'boolean',
          description: expect.stringContaining('full viewport'),
        }),
      )
      expect(props.find(prop => prop.name === 'onToggle')).toEqual(
        expect.objectContaining({
          type: '(isOpen: boolean) => void',
          description: expect.stringContaining('open(), close(), and toggle()'),
        }),
      )
      expect(props.find(prop => prop.name === 'hotKey')).toEqual(
        expect.objectContaining({
          type: 'HotKey',
          description: expect.stringContaining('handle is hidden'),
        }),
      )
      expect(props.find(prop => prop.name === 'title')).toEqual(
        expect.objectContaining({
          type: 'string',
          description: expect.stringContaining('drawer.heading'),
        }),
      )
      for (const name of ['content', 'drawer']) {
        const prop = props.find(prop => prop.name === name)
        expect(prop?.type).toBe(
          framework === 'core' ? 'View' : 'React.ReactNode',
        )
        if (framework === 'core') {
          expect(prop?.description).toContain('constructor-only')
        }
      }
      expect(props.find(prop => prop.name === 'children')?.type).toBe(
        framework === 'core' ? 'View[]' : 'React.ReactNode',
      )
      if (framework === 'core') {
        for (const name of ['child', 'children']) {
          expect(props.find(prop => prop.name === name)?.description).toContain(
            'update()/add()',
          )
        }
      }
      for (const name of ['width', 'height']) {
        expect(props.find(prop => prop.name === name)?.type).toBe('Dimension')
      }
    }
    expect(drawerExample.props.find(prop => prop.name === 'ref')).toEqual({
      name: 'ref',
      type: 'React.Ref<Drawer>',
      description: 'Reference to the underlying Core Drawer',
      availability: 'react',
    })
  })

  it('matches the documented Core state callbacks and update slots', () => {
    const onToggle = vi.fn()
    const drawer = new Drawer({
      content: new Text({text: 'Main'}),
      drawer: new Text({text: 'Panel'}),
      onToggle,
    })
    expect(onToggle).not.toHaveBeenCalled()
    drawer.open()
    drawer.open()
    drawer.close()
    drawer.toggle()
    expect(onToggle.mock.calls).toEqual([[true], [false], [true]])

    const content = new Text({text: 'Replacement main'})
    const panel = new Text({text: 'Replacement panel'})
    drawer.update({children: [content, panel]})
    expect(drawer.contentView).toBe(content)
    expect(drawer.drawerView).toBe(panel)
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact executable sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/drawer.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(drawerExample.source[framework]()).toBe(source)
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|tui-|setTimeout|setInterval/,
      )
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).toContain('receiveTick(1000)')
      expect(source).toContain('screen.render()')
      if (framework === 'react') {
        expect(source).toContain('await run(')
        expect(source).toContain('<Stack.down width={32} height={10} gap={1}>')
        expect(source).toContain('<Drawer.right')
        expect(source).toContain('ref={openDrawer}')
        expect(source).toContain(
          'createRef<React.ElementRef<typeof Drawer.right>>()',
        )
        expect(source).toContain('location="left"')
        expect(source).toMatch(/\n\s+isOpen\n/)
        expect(source).toMatch(/\n\s+hidesWhenClosed\n/)
        expect(source).not.toContain('createElement')
        expect(source).not.toContain("from '@teaui/core'")
      } else {
        expect(source).toContain('width: 32')
        expect(source).toContain('height: 10')
        expect(source).toContain("location: 'right'")
        expect(source).toContain('isOpen: true')
        expect(source).toContain('hidesWhenClosed: true')
        expect(source).toContain('new Drawer(')
        expect(source).toContain('await Screen.start(examples)')
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await drawerExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)

      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(text).toContain('Messages')
      expect(text).toContain('Pick a folder')
      expect(text).toContain('Folders')
      expect(text).toContain('Inbox')
      expect(text).toContain('Drafts')
      expect(text).toContain('Archive')
      expect(text).not.toContain('Settings')
      expect(text).not.toContain('Preferences')
      expect(lines.slice(7).map(line => line.trimEnd())).toEqual([
        'Hidden when closed',
        'Alt+H opens hidden panel',
        'Full-width content, no chrome',
      ])
      expect(text.match(/›/g)).toHaveLength(4)
      expect(text).not.toContain('‹')
      expect(text).toMatchSnapshot()
      expect(await drawerExample.render[framework]()).toBe(output)
    },
  )

  it('produces identical Core and public-wrapper React text', async () => {
    expect(removeAnsi(await drawerExample.render.react())).toBe(
      removeAnsi(await drawerExample.render.core()),
    )
  })
})
