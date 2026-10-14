import {readFileSync} from 'node:fs'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {
  Radio,
  RadioGroup,
  Screen,
  Stack,
  lineWidth,
  removeAnsi,
  testRender,
} from '@teaui/core'

import {radioGroupExample} from '../lib/examples/samples/radio-group.js'
import * as capture from '../lib/examples/samples/capture.js'

const SIZE = {width: 32, height: 5}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('radio-group CLI component example', () => {
  it('documents generic group selection and framework-specific children', () => {
    expect(radioGroupExample.name).toBe('radio-group')
    expect(radioGroupExample.availability).toBe('both')

    for (const framework of ['core', 'react'] as const) {
      const props = radioGroupExample.props.filter(
        prop => prop.availability === 'both' || prop.availability === framework,
      )
      const names = props.map(prop => prop.name)
      expect(names).toEqual([
        'value',
        'onChange',
        'purpose',
        'width',
        'height',
        ...(framework === 'core' ? ['child', 'children'] : ['children', 'ref']),
      ])
      expect(new Set(names).size).toBe(names.length)
      expect(props.find(prop => prop.name === 'value')).toEqual(
        expect.objectContaining({
          type: 'T',
          description: expect.stringContaining('Optional selected value'),
          availability: 'both',
        }),
      )
      expect(props.find(prop => prop.name === 'value')?.description).toContain(
        'Object.is',
      )
      expect(props.find(prop => prop.name === 'onChange')).toEqual(
        expect.objectContaining({
          type: '(value: T) => void',
          description: expect.stringContaining('only when'),
          availability: 'both',
        }),
      )
      expect(
        props.find(prop => prop.name === 'onChange')?.description,
      ).toContain('React should update its value prop')
      expect(props.find(prop => prop.name === 'children')).toEqual(
        expect.objectContaining({
          type: framework === 'core' ? 'View[]' : 'React.ReactNode',
          description: expect.stringContaining('nearest RadioGroup ancestor'),
          availability: framework,
        }),
      )
      for (const name of ['width', 'height']) {
        expect(props.find(prop => prop.name === name)?.type).toBe('Dimension')
      }
      for (const name of [
        'title',
        'hotKey',
        'choices',
        'selected',
        'multiple',
      ]) {
        expect(names).not.toContain(name)
      }
    }
    expect(radioGroupExample.props.find(prop => prop.name === 'ref')).toEqual({
      name: 'ref',
      type: 'React.Ref<RadioGroup<T>>',
      description: 'Reference to the underlying Core RadioGroup<T>',
      availability: 'react',
    })
  })

  it('matches optional generic values, Object.is equality, and silent assignment', () => {
    const onChange = vi.fn()
    const group = new RadioGroup<{id: number}>({onChange})
    const value = {id: 1}
    expect(group.value).toBeUndefined()
    group.select(value)
    expect(group.value).toBe(value)
    expect(group.isSelected(value)).toBe(true)
    expect(group.isSelected({id: 1})).toBe(false)
    group.select(value)
    expect(onChange).toHaveBeenCalledExactlyOnceWith(value)

    group.value = undefined
    expect(group.value).toBeUndefined()
    expect(group.isSelected(value)).toBe(false)
    expect(onChange).toHaveBeenCalledOnce()

    const numbers = new RadioGroup<number>({value: NaN})
    expect(numbers.isSelected(NaN)).toBe(true)
    numbers.value = 0
    expect(numbers.isSelected(-0)).toBe(false)
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact deterministic public sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/radio-group.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(radioGroupExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).toContain("const INITIAL_VALUE = 'standard'")
      expect(source).toContain('RadioGroup')
      expect(source).toContain('Stack.down')
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|tui-|createElement|setTimeout|setInterval|Math\.random|Date\./,
      )
      if (framework === 'core') {
        expect(source).toContain('width: 32')
        expect(source).toContain('height: 5')
        expect(source).toContain('await Screen.start(group)')
        expect(source).toContain('new Radio({title, value})')
        expect(source).toContain('summary.text = describeSelection(value)')
      } else {
        expect(source).toContain('await run(<App />)')
        expect(source).toContain('<RadioGroup width={32} height={5}')
        expect(source).toContain(
          '<Radio key={value} title={title} value={value} />',
        )
        expect(source).toContain('useState(INITIAL_VALUE)')
        expect(source).toContain('value={value} onChange={setValue}')
        expect(source).toContain('<Stack.down gap={1}>')
        expect(source).toContain('<Text>{describeSelection(value)}</Text>')
        expect(source).not.toContain("from '@teaui/core'")
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await radioGroupExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(output).toBe(await captureSpy.mock.results[0].value)
      const text = removeAnsi(output)
      expect(text).toContain('◯ Economy')
      expect(text).toContain('⦿ Standard')
      expect(text).toContain('◯ Express')
      expect(text).toContain('Shipping: Standard')
      expect(text.match(/⦿/g)).toHaveLength(1)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(text).toMatchSnapshot()
      expect(await radioGroupExample.render[framework]()).toBe(output)
      expect(captureSpy).toHaveBeenNthCalledWith(2, moduleUrl, SIZE)
    },
  )

  it.each(['core', 'react'] as const)(
    '%s executable sample changes the shared selection and summary by keyboard and mouse',
    async framework => {
      // Reuse the exact sample's mounted tree, not a separate test-only UI.
      const stopSpy = vi.spyOn(Screen.prototype, 'stop')
      await radioGroupExample.render[framework]()
      const screen = stopSpy.mock.contexts[0]
      if (!(screen instanceof Screen)) {
        throw new Error('Sample did not stop a TeaUI screen')
      }
      const root = screen.rootView
      stopSpy.mockRestore()
      const t = testRender(root, SIZE)
      try {
        t.sendKey('tab')
        t.sendKey('return')
        await vi.waitFor(() => {
          t.render()
          expect(t.terminal.textContent()).toContain('Shipping: Economy')
        })
        expect(t.terminal.textContent()).toContain('⦿ Economy')
        expect(t.terminal.textContent()).toContain('◯ Standard')

        t.sendMouse('mouse.button.down', {x: 0, y: 2})
        t.sendMouse('mouse.button.up', {x: 0, y: 2})
        await vi.waitFor(() => {
          t.render()
          expect(t.terminal.textContent()).toContain('Shipping: Express')
        })
        const text = t.terminal.textContent()
        expect(text).toContain('◯ Economy')
        expect(text).toContain('◯ Standard')
        expect(text).toContain('⦿ Express')
        expect(text.match(/⦿/g)).toHaveLength(1)
        expect(text).toMatchSnapshot()
      } finally {
        root.screen?.stop()
      }
    },
  )

  it('assigns nested Radios to their nearest group, not the enclosing group', () => {
    const onOuterChange = vi.fn()
    const onInnerChange = vi.fn()
    const inner = new RadioGroup({
      value: 'standard',
      onChange: onInnerChange,
      child: Stack.down([
        new Radio({title: 'Standard', value: 'standard'}),
        new Radio({title: 'Express', value: 'express'}),
      ]),
    })
    const outer = new RadioGroup({
      value: 'economy',
      onChange: onOuterChange,
      child: Stack.down([
        new Radio({title: 'Economy', value: 'economy'}),
        inner,
      ]),
    })
    const t = testRender(outer, {width: 32, height: 3})
    try {
      t.sendMouse('mouse.button.down', {x: 0, y: 2})
      t.sendMouse('mouse.button.up', {x: 0, y: 2})
      t.render()
      expect(outer.value).toBe('economy')
      expect(inner.value).toBe('express')
      expect(onOuterChange).not.toHaveBeenCalled()
      expect(onInnerChange).toHaveBeenCalledExactlyOnceWith('express')
      expect(t.terminal.textContent()).toMatchSnapshot()
    } finally {
      outer.screen?.stop()
    }
  })

  it('renders identical Core and public-wrapper React text', async () => {
    const core = await radioGroupExample.render.core()
    const react = await radioGroupExample.render.react()
    expect(removeAnsi(react)).toBe(removeAnsi(core))
  })
})
