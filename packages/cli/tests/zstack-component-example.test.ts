import {readFileSync} from 'node:fs'
import {lineWidth, removeAnsi, Screen, Size, Text, ZStack} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {zstackExample} from '../lib/examples/samples/zstack.js'

const SIZE = {width: 44, height: 15}
const LOCATIONS = [
  'top-left',
  'top-center',
  'top-right',
  'left',
  'center',
  'right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
] as const

afterEach(() => {
  vi.restoreAllMocks()
})

describe('zstack CLI component example', () => {
  it('documents locations, overlay ordering, and framework-specific props accurately', () => {
    expect(zstackExample.name).toBe('zstack')
    expect(zstackExample.availability).toBe('both')
    expect(zstackExample.description).toContain('insertion order')
    expect(
      zstackExample.props.map(({name, type, availability}) => ({
        name,
        type,
        availability,
      })),
    ).toEqual([
      {
        name: 'location',
        type: LOCATIONS.map(location => `'${location}'`).join(' | '),
        availability: 'both',
      },
      {
        name: 'width',
        type: "number | 'fill' | 'shrink' | 'natural'",
        availability: 'both',
      },
      {
        name: 'height',
        type: "number | 'fill' | 'shrink' | 'natural'",
        availability: 'both',
      },
      {name: 'padding', type: 'number | Partial<Edges>', availability: 'both'},
      {name: 'isVisible', type: 'boolean', availability: 'both'},
      {name: 'child', type: 'View', availability: 'core'},
      {name: 'children', type: 'View[]', availability: 'core'},
      {name: 'children', type: 'React.ReactNode', availability: 'react'},
      {name: 'ref', type: 'React.Ref<ZStack>', availability: 'react'},
    ])

    const description = (name: string) =>
      zstackExample.props.find(prop => prop.name === name)!.description
    expect(description('location')).toContain('Unset by default')
    expect(description('location')).toContain('maximum visible child size')
    expect(description('location')).toContain('fills available space')
    expect(description('location')).toContain('natural size, capped')
    expect(description('location')).toContain('align setter')
    expect(description('location')).toContain('not a location setter')
    expect(description('child')).toContain('takes precedence over constructor')
    expect(description('children')).toContain('later children render on top')
    expect(description('isVisible')).toContain('sizing and rendering')
    expect(description('ref')).toContain('align getter/setter')

    for (const framework of ['core', 'react'] as const) {
      const names = zstackExample.props
        .filter(
          prop =>
            prop.availability === 'both' || prop.availability === framework,
        )
        .map(prop => prop.name)
      expect(names).toEqual([
        'location',
        'width',
        'height',
        'padding',
        'isVisible',
        ...(framework === 'core' ? ['child', 'children'] : ['children', 'ref']),
      ])
      expect(new Set(names).size).toBe(names.length)
      expect(names).not.toContain('align')
    }
  })

  it('matches default maximum-child sizing, hidden children, and constructor child precedence', () => {
    const available = new Size(44, 15)
    const children = [
      new Text({text: 'wide', width: 10, height: 2}),
      new Text({text: 'tall', width: 4, height: 3}),
      new Text({text: 'hidden', width: 40, height: 12, isVisible: false}),
    ]
    const stack = new ZStack({children})
    expect(stack.align).toBeUndefined()
    expect(stack.children).toEqual(children)
    expect(stack.naturalSize(available)).toEqual(new Size(10, 3))
    expect(new ZStack().naturalSize(available)).toEqual(Size.zero)

    const child = new Text('single')
    const single = new ZStack({children, child})
    expect(single.children).toEqual([child])
    expect(single.naturalSize(available)).toEqual(new Size(6, 1))
  })

  it.each(LOCATIONS)(
    '%s fills natural size, supports the public align setter, and updates location',
    location => {
      const available = new Size(44, 15)
      const stack = new ZStack({location, child: new Text('OK')})
      expect(stack.align).toBe(location)
      expect(stack.naturalSize(available)).toEqual(available)

      const invalidation = vi.spyOn(stack, 'invalidateSize')
      stack.align = location
      expect(invalidation).not.toHaveBeenCalled()
      stack.align = undefined
      expect(invalidation).toHaveBeenCalledOnce()
      expect(stack.naturalSize(available)).toEqual(new Size(2, 1))

      stack.update({location})
      expect(stack.align).toBe(location)
      expect(stack.naturalSize(available)).toEqual(available)
    },
  )

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact deterministic public sample',
    async framework => {
      const extension = framework === 'react' ? 'tsx' : 'js'
      const moduleUrl = new URL(
        `../lib/examples/samples/zstack.${framework}.${extension}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(zstackExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|tui-|setTimeout|setInterval|Math\.random|Date\./,
      )
      expect(source).toContain('const CELL_WIDTH = 14')
      expect(source).toContain('const CELL_HEIGHT = 3')
      for (const location of LOCATIONS) {
        expect(source).toContain(
          framework === 'core' ? `'${location}'` : `location="${location}"`,
        )
      }
      if (framework === 'core') {
        expect(source).toContain('new ZStack({')
        expect(source).toContain('width: 44')
        expect(source).toContain('height: 15')
        expect(source).toContain('isVisible: false')
        expect(source).toContain('await Screen.start(examples)')
      } else {
        expect(source).toContain('<ZStack>')
        expect(source).toContain('<ZStack width={CELL_WIDTH}')
        expect(source).toContain('width={44} height={15}')
        expect(source).toContain('isVisible={false}')
        expect(source).toContain('await run(<App />)')
        expect(source).not.toMatch(/createElement|from '@teaui\/core'/)
      }

      const start = Screen.start
      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await zstackExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(output).toBe(await captureSpy.mock.results[0].value)
      expect(Screen.start).toBe(start)

      const lines = removeAnsi(output).split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(lines[0].trimEnd()).toBe('Later children overwrite earlier ones')
      expect(lines[1]).toBe('OVER456789' + ' '.repeat(34))
      expect(lines[2].trimEnd()).toBe(
        'location: natural-size layers in 14x3 cells',
      )
      expect(output).not.toContain('hidden')

      // Each 14x3 cell contains a full background layer and a natural-size OK.
      for (let row = 0; row < 3; row++) {
        for (let column = 0; column < 3; column++) {
          const x = column * 15
          const y = 3 + row * 4
          expect(lines[y].slice(x, x + 14).trimEnd()).toBe(
            LOCATIONS[row * 3 + column],
          )
          for (let offset = 0; offset < 3; offset++) {
            const background = '.'.repeat(14)
            const badgeX = column * 6
            const expected =
              offset === row
                ? background.slice(0, badgeX) +
                  'OK' +
                  background.slice(badgeX + 2)
                : background
            expect(lines[y + 1 + offset].slice(x, x + 14)).toBe(expected)
          }
        }
      }
      // Screen.start is replaced during capture; render sequentially only.
      expect(await zstackExample.render[framework]()).toBe(output)
      expect(Screen.start).toBe(start)
    },
  )

  it('produces identical Core and JSX React output with every location visible', async () => {
    const core = await zstackExample.render.core()
    const react = await zstackExample.render.react()
    expect(react).toBe(core)
    expect(removeAnsi(core)).toMatchSnapshot()
  })
})
