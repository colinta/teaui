import {readFileSync} from 'node:fs'
import {
  lineWidth,
  removeAnsi,
  Screen,
  Size,
  Slider,
  testRender,
  type View,
} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {sliderExample} from '../lib/examples/samples/slider.js'

const SIZE = {width: 44, height: 27}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('slider CLI component example', () => {
  it('documents actual defaults, interaction, Core setters, and React-only refs', () => {
    expect(sliderExample.name).toBe('slider')
    expect(sliderExample.availability).toBe('both')
    expect(sliderExample.description).toContain('Tab to focus')
    for (const framework of ['core', 'react'] as const) {
      const props = sliderExample.props.filter(
        prop => prop.availability === 'both' || prop.availability === framework,
      )
      const names = props.map(prop => prop.name)
      expect(names).toEqual([
        'direction',
        'range',
        'value',
        'step',
        'buttons',
        'border',
        'onChange',
        'purpose',
        'width',
        'height',
        ...(framework === 'react' ? ['ref'] : []),
      ])
      expect(new Set(names).size).toBe(names.length)
      for (const name of [
        'child',
        'children',
        'min',
        'max',
        'title',
        'hotKey',
      ]) {
        expect(names).not.toContain(name)
      }
    }
    const prop = (name: string) =>
      sliderExample.props.find(prop => prop.name === name)!
    expect(prop('direction').type).toBe("'horizontal' | 'vertical'")
    expect(prop('direction').description).toContain('Defaults to horizontal')
    expect(prop('direction').description).toContain('top to bottom')
    expect(prop('direction').description).toContain('React also provides')
    expect(prop('range').type).toBe('[number, number]')
    expect(prop('range').description).toContain('Inclusive')
    expect(prop('range').description).toContain('defaults to [0, 1]')
    expect(prop('value').type).toBe('number')
    expect(prop('value').description).toContain('Defaults to the range minimum')
    expect(prop('value').description).toContain('without calling onChange')
    expect(prop('step').type).toBe('number')
    expect(prop('step').description).toContain(
      'Defaults to 1 and is at least 1',
    )
    expect(prop('step').description).toContain('integer steps')
    expect(prop('step').description).toContain(
      'Required by Core constructor types',
    )
    for (const name of ['buttons', 'border']) {
      expect(prop(name).type).toBe('boolean')
      expect(prop(name).description).toContain('Defaults to false')
    }
    expect(prop('border').description).toContain('at least three rows')
    expect(prop('border').description).toContain('Core border assignment')
    expect(prop('onChange').type).toBe('(value: number) => void')
    expect(prop('onChange').description).toContain('Called only when')
    expect(prop('onChange').description).toContain('controlled slider')
    expect(prop('purpose').type).toBe('Palette | Purpose')
    for (const name of ['width', 'height']) {
      expect(prop(name).type).toBe('Dimension')
    }
    expect(prop('width').description).toContain(
      'max(5, ceil((max - min) / step))',
    )
    expect(prop('height').description).toContain('Explicit dimensions override')
    expect(prop('ref')).toEqual({
      name: 'ref',
      type: 'React.Ref<Slider>',
      description: 'Reference to the underlying Core Slider',
      availability: 'react',
    })
  })

  it('checks documented natural sizes in both directions with every frame/button combination', () => {
    const available = new Size(SIZE.width, SIZE.height)
    expect(new Slider({}).naturalSize(available)).toEqual(new Size(5, 1))
    for (const direction of ['horizontal', 'vertical'] as const) {
      for (const [border, buttons, horizontal, vertical] of [
        [false, false, new Size(7, 1), new Size(1, 7)],
        [true, false, new Size(9, 3), new Size(3, 9)],
        [false, true, new Size(13, 1), new Size(1, 9)],
        [true, true, new Size(13, 3), new Size(3, 13)],
      ] as const) {
        const slider = new Slider({
          direction,
          range: [10, 45],
          value: 20,
          step: 5,
          border,
          buttons,
        })
        expect(slider.naturalSize(available)).toEqual(
          direction === 'horizontal' ? horizontal : vertical,
        )
      }
    }
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact deterministic public sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/slider.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(sliderExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|tui-|createElement|setTimeout|setInterval|Math\.random|Date\.|\.\.\//,
      )
      expect(source).toContain('const INITIAL_VALUE = 20')
      if (framework === 'core') {
        expect(source).toContain('width: 44')
        expect(source).toContain('height: 27')
        expect(source).toContain('new Slider({width: 44, height: 1})')
        expect(source).toContain('range: [10, 30]')
        expect(source).toContain('buttons: true')
        expect(source).toContain('border: true')
        expect(source).toContain('step: 5')
        expect(source).toContain("direction: 'vertical'")
        expect(source).toContain('step: 25')
        expect(source).toContain('summary.text = describeValue(value)')
        expect(source).toContain('await Screen.start(examples)')
      } else {
        expect(source).toContain('<Stack.down width={44} height={27}>')
        expect(source).toContain('<Slider width={44} height={1} />')
        expect(source).toContain('range={[10, 30]}')
        expect(source).toContain('step={5}')
        expect(source).toContain('useState(INITIAL_VALUE)')
        expect(source).toContain('onChange={setValue}')
        expect(source).toContain('<Slider.horizontal')
        expect(source).toContain('<Slider direction="vertical"')
        expect(source).toContain('<Slider.vertical')
        expect(source).toContain('await run(<App />)')
        expect(source).not.toContain("from '@teaui/core'")
      }

      const start = Screen.start
      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await sliderExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(output).toBe(await captureSpy.mock.results[0].value)
      expect(Screen.start).toBe(start)

      const rendered = removeAnsi(output)
      const lines = rendered.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(lines[0].trimEnd()).toBe('Default: range [0, 1], value 0')
      expect(lines[1]).toBe('█╶' + '─'.repeat(42))
      expect(lines[3]).toBe('╭' + '─'.repeat(42) + '╮')
      expect(lines[4]).toBe('│' + '─'.repeat(20) + '╴█╶' + '─'.repeat(19) + '│')
      expect(lines[6].trimEnd()).toBe('Buttons: range [10, 30], value 20')
      expect(lines[7]).toBe(
        '[◃]' + '─'.repeat(18) + '╴█╶' + '─'.repeat(17) + '[▹]',
      )
      expect(lines[9]).toBe('╭─┬' + '─'.repeat(38) + '┬─╮')
      expect(lines[10]).toBe(
        '│◃│' + '─'.repeat(27) + '╴█╶' + '─'.repeat(8) + '│▹│',
      )
      expect(lines[13]).toBe(
        '█╶' + '─'.repeat(19) + '  ' + '─'.repeat(19) + '╴█',
      )
      expect(lines[14].trimEnd()).toBe(
        'Vertical: [0, 100], step 25; down = more',
      )
      expect(lines[15].trimEnd()).toBe('Plain      Border     Buttons    Both')
      const vertical = lines.slice(16)
      expect(vertical.map(line => line[0])).toEqual([
        '│',
        '│',
        '│',
        '│',
        '╵',
        '█',
        '╷',
        '│',
        '│',
        '│',
        '│',
      ])
      expect(vertical[0].slice(11, 14)).toBe('╭─╮')
      expect(vertical[10].slice(11, 14)).toBe('╰─╯')
      expect(vertical[0][22]).toBe('▵')
      expect(vertical[10][22]).toBe('▿')
      expect(vertical[0].slice(33, 36)).toBe('╭─╮')
      expect(vertical[1].slice(33, 36)).toBe('│▵│')
      expect(vertical[2].slice(33, 36)).toBe('├─┤')
      expect(vertical[5].slice(33, 36)).toBe('│█│')
      expect(vertical[8].slice(33, 36)).toBe('├─┤')
      expect(vertical[9].slice(33, 36)).toBe('│▿│')
      expect(vertical[10].slice(33, 36)).toBe('╰─╯')
      expect(rendered).toMatchSnapshot()

      expect(await sliderExample.render[framework]()).toBe(output)
      expect(captureSpy).toHaveBeenNthCalledWith(2, moduleUrl, SIZE)
    },
  )

  it('captures identical visible Core and JSX React output', async () => {
    // captureExample temporarily replaces Screen.start: capture sequentially.
    // React's Root can style otherwise-empty gaps differently from a Core root.
    const core = await sliderExample.render.core()
    const react = await sliderExample.render.react()
    expect(removeAnsi(react)).toBe(removeAnsi(core))
  })

  it.each(['core', 'react'] as const)(
    '%s executable sample updates its label through the public onChange callback',
    async framework => {
      let root: View | undefined
      const start = Screen.prototype.start
      vi.spyOn(Screen.prototype, 'start').mockImplementation(
        function (this: Screen) {
          root = this.rootView
          start.call(this)
        },
      )
      await sliderExample.render[framework]()
      expect(root).toBeDefined()
      const t = testRender(root!, SIZE)
      const label = () => t.terminal.textContent().split('\n')[6].trimEnd()
      expect(label()).toBe('Buttons: range [10, 30], value 20')
      // The third slider is the custom-range example; buttons are not focus stops.
      t.sendKey('tab')
      t.sendKey('tab')
      t.sendKey('tab')
      t.sendKey('right')
      expect(label()).toBe('Buttons: range [10, 30], value 25')
      t.sendKey('end')
      expect(label()).toBe('Buttons: range [10, 30], value 30')
      t.sendKey('right')
      expect(label()).toBe('Buttons: range [10, 30], value 30')
      t.sendKey('home')
      expect(label()).toBe('Buttons: range [10, 30], value 10')
      t.sendMouse('mouse.button.down', {x: 42, y: 7})
      t.sendMouse('mouse.button.up', {x: 42, y: 7})
      expect(label()).toBe('Buttons: range [10, 30], value 15')
      t.sendMouse('mouse.button.down', {x: 22, y: 7})
      t.sendMouse('mouse.button.up', {x: 22, y: 7})
      expect(label()).toBe('Buttons: range [10, 30], value 20')
      const fresh = removeAnsi(await sliderExample.render[framework]())
      expect(fresh.split('\n')[6].trimEnd()).toBe(
        'Buttons: range [10, 30], value 20',
      )
    },
  )
})
