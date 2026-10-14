import {readFileSync} from 'node:fs'
import {
  Screen,
  Text,
  Tree,
  lineWidth,
  removeAnsi,
  testRender,
} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {treeExample} from '../lib/examples/samples/tree.js'

const SIZE = {width: 30, height: 10}
const HIERARCHY = [
  'Project',
  '├─╴▿src',
  '│   ├─╴▿components',
  '│   │   ├──╴App.tsx',
  '│   │   └──╴Button.tsx',
  '│   └──╴index.ts',
  '├─╴▹assets',
  '└──╴package.json',
  '',
  '',
]

const POINTER = {
  type: 'mouse' as const,
  button: 'left' as const,
  ctrl: false,
  alt: false,
  gui: false,
  shift: false,
}

interface Item {
  name: string
  children?: Item[]
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('tree CLI component example', () => {
  it('documents the generic callbacks and distinct Core and React title APIs', () => {
    expect(treeExample.name).toBe('tree')
    expect(treeExample.availability).toBe('both')
    expect(treeExample.description).toContain('branches start collapsed')
    expect(treeExample.description).toContain('not a controlled prop')
    expect(
      treeExample.props.map(({name, type, availability}) => ({
        name,
        type,
        availability,
      })),
    ).toEqual([
      {name: 'data', type: 'T[]', availability: 'both'},
      {
        name: 'render',
        type: '(datum: T, path: string) => View',
        availability: 'core',
      },
      {
        name: 'render',
        type: '(datum: T) => React.ReactNode',
        availability: 'react',
      },
      {
        name: 'getChildren',
        type: '(datum: T, path: string) => T[] | undefined',
        availability: 'core',
      },
      {
        name: 'getChildren',
        type: '(datum: T) => T[] | undefined',
        availability: 'react',
      },
      {name: 'titleView', type: 'View', availability: 'core'},
      {
        name: 'title',
        type: 'React.ReactNode | string',
        availability: 'react',
      },
      {name: 'width', type: 'Dimension', availability: 'both'},
      {name: 'height', type: 'Dimension', availability: 'both'},
    ])

    for (const framework of ['core', 'react'] as const) {
      const props = treeExample.props.filter(
        prop => prop.availability === 'both' || prop.availability === framework,
      )
      const names = props.map(prop => prop.name)
      const prop = (name: string) => props.find(prop => prop.name === name)!
      expect(names).toEqual([
        'data',
        'render',
        'getChildren',
        framework === 'core' ? 'titleView' : 'title',
        'width',
        'height',
      ])
      expect(new Set(names).size).toBe(names.length)
      expect(prop('data').description).toContain('Required root items')
      expect(prop('data').description).toContain('positional paths')
      expect(prop('getChildren').description).toContain('Optional')
      expect(prop('getChildren').description).toContain(
        'empty array means a leaf',
      )
      expect(prop('width').description).toContain('four columns')
      expect(prop('height').description).toContain('Scrollable parent')
      for (const name of ['expanded', 'onToggle', 'children', 'child', 'ref']) {
        expect(names).not.toContain(name)
      }
      if (framework === 'core') {
        expect(prop('render').description).toContain('cached by path')
        expect(prop('getChildren').description).toContain('dotted index path')
        expect(prop('titleView').description).toContain(
          'Required by Core types',
        )
      } else {
        expect(prop('render').description).toContain('not its index or path')
        expect(prop('getChildren').description).toContain(
          'receives only the node',
        )
        expect(prop('title').description).toContain('Required by React types')
        expect(prop('title').description).toContain('null omits the title')
      }
    }
  })

  it.each(['core', 'react'] as const)(
    '%s captures its exact executable public sample with nested branches expanded',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/tree.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(treeExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).not.toMatch(
        /createElement|captureExample|HeadlessProgram|testRender|tui-|setTimeout|setInterval|Math\.random|Date\./,
      )
      expect(source).toContain('screen.trigger(')
      expect(source).toContain('screen.render()')
      expect(source).toContain('getChildren')
      if (framework === 'core') {
        expect(source).toContain('await Screen.start(tree)')
        expect(source).toContain("titleView: new Text('Project')")
        expect(source).toContain('render: item => new Text(item.name)')
      } else {
        expect(source).toContain('await run(')
        expect(source).toContain('<Tree<Item>')
        expect(source).toContain('interface Item')
        expect(source).toContain('children?: Item[]')
        expect(source).toContain('render={item => <Text>{item.name}</Text>}')
        expect(source).not.toContain("from '@teaui/core'")
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const trigger = vi.spyOn(Screen.prototype, 'trigger')
      const output = await treeExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(output).toBe(await captureSpy.mock.results[0].value)
      expect(trigger.mock.calls.map(([event]) => event)).toEqual([
        {...POINTER, name: 'mouse.button.down', x: 2, y: 1},
        {...POINTER, name: 'mouse.button.up', x: 2, y: 1},
        {...POINTER, name: 'mouse.button.down', x: 6, y: 2},
        {...POINTER, name: 'mouse.button.up', x: 6, y: 2},
        {...POINTER, name: 'mouse.move.in', x: 29, y: 9},
      ])

      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(lines.map(line => line.trimEnd())).toEqual(HIERARCHY)
      expect(text).not.toContain('logo.svg')
      expect(text).not.toMatch(/[▾▸]/)
      expect(text).toMatchSnapshot('expanded hierarchy and collapsed sibling')
      expect(output).toMatchSnapshot('exact styled capture')
      expect(await treeExample.render[framework]()).toBe(output)
    },
  )

  it('renders equivalent public Core and JSX hierarchies', async () => {
    expect(removeAnsi(await treeExample.render.react())).toBe(
      removeAnsi(await treeExample.render.core()),
    )
  })

  it('uses dotted Core callback paths, cached views, and click-only branch expansion', () => {
    const data: Item[] = [
      {
        name: 'Folder',
        children: [{name: 'Nested', children: [{name: 'Leaf'}]}],
      },
      {name: 'Empty', children: []},
    ]
    const render = vi.fn((item: Item, _path: string) => new Text(item.name))
    const getChildren = vi.fn((item: Item, _path: string) => item.children)
    const props = {
      ...SIZE,
      data,
      titleView: new Text('Paths'),
      render,
      getChildren,
    }
    const tree = new Tree<Item>(props)
    const t = testRender(tree, {...SIZE, isFocused: false})
    const click = (x: number, y: number) => {
      t.sendMouse('mouse.button.down', {x, y})
      t.sendMouse('mouse.button.up', {x, y})
      t.sendMouse('mouse.move.in', {x: 29, y: 9})
    }
    expect(t.terminal.textContent()).toContain('├─╴▹Folder')
    expect(t.terminal.textContent()).toContain('└──╴Empty')
    expect(t.terminal.textContent()).not.toContain('Nested')
    expect(render.mock.calls).toEqual([
      [data[0], '.0'],
      [data[1], '.1'],
    ])
    expect(getChildren.mock.calls).toEqual([
      [data[0], '.0'],
      [data[1], '.1'],
    ])

    t.sendMouse('mouse.button.down', {x: 2, y: 1})
    expect(t.terminal.textContent()).not.toContain('Nested')
    t.sendMouse('mouse.button.up', {x: 2, y: 1})
    expect(render).toHaveBeenLastCalledWith(data[0].children![0], '.0.0')
    click(6, 2)
    expect(render).toHaveBeenLastCalledWith(
      data[0].children![0].children![0],
      '.0.0.0',
    )
    expect(t.terminal.textContent()).toContain('│       └──╴Leaf')
    expect(render).toHaveBeenCalledTimes(4)
    expect(getChildren).toHaveBeenCalledWith(data[0].children![0], '.0.0')

    click(2, 1)
    expect(t.terminal.textContent()).not.toContain('Nested')
    click(2, 2) // Empty arrays are leaves, not toggleable branches.
    click(2, 1)
    expect(t.terminal.textContent()).toContain('│       └──╴Leaf')
    tree.update(props)
    t.render()
    expect(render).toHaveBeenCalledTimes(4)
    expect(t.terminal.textContent()).toContain('│       └──╴Leaf')
  })
})
