import {readFileSync} from 'node:fs'
import {
  lineWidth,
  removeAnsi,
  Screen,
  Size,
  testRender,
  ToggleGroup,
} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {toggleGroupExample} from '../lib/examples/samples/toggle-group.js'

const SIZE = {width: 36, height: 11}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('toggle-group CLI component example', () => {
  it('documents required index arrays, nullable single selection, and current limitations', () => {
    expect(toggleGroupExample.name).toBe('toggle-group')
    expect(toggleGroupExample.availability).toBe('both')
    expect(toggleGroupExample.description).toContain('Mouse-operated')
    expect(toggleGroupExample.description).toContain('even in single mode')
    expect(toggleGroupExample.description).toContain('no built-in keyboard')

    for (const framework of ['core', 'react'] as const) {
      const names = toggleGroupExample.props
        .filter(
          prop =>
            prop.availability === 'both' || prop.availability === framework,
        )
        .map(prop => prop.name)
      expect(names).toEqual([
        'titles',
        'selected',
        'onChange',
        'multiple',
        'direction',
        'padding',
        'purpose',
        'width',
        'height',
        ...(framework === 'react' ? ['ref'] : []),
      ])
      expect(new Set(names).size).toBe(names.length)
      for (const name of ['value', 'children', 'child', 'hotKey', 'disabled']) {
        expect(names).not.toContain(name)
      }
    }
    const prop = (name: string) =>
      toggleGroupExample.props.find(prop => prop.name === name)!
    expect(prop('titles').type).toBe('string[]')
    expect(prop('titles').description).toContain('Required')
    expect(prop('selected').type).toBe('number[]')
    expect(prop('selected').description).toContain('Required zero-based')
    expect(prop('selected').description).toContain('use [] for none')
    expect(prop('selected').description).toContain('does not normalize')
    expect(prop('selected').description).toContain('complete props')
    expect(prop('selected').description).toContain('not a selected setter')
    expect(prop('onChange').type).toBe(
      '(changed: number, selected: number[]) => void',
    )
    expect(prop('onChange').description).toContain('insertion order')
    expect(prop('onChange').description).toContain('updates do not notify')
    expect(prop('multiple').type).toBe('boolean')
    expect(prop('multiple').description).toContain('Defaults to false')
    expect(prop('direction').type).toBe("'horizontal' | 'vertical'")
    expect(prop('direction').description).toContain('not implemented')
    expect(prop('padding').type).toBe('number')
    expect(prop('padding').description).toContain('defaults to 1')
    expect(prop('padding').description).toContain('outer View padding')
    expect(prop('purpose').type).toBe('Palette | Purpose')
    expect(prop('width').type).toBe('Dimension')
    expect(prop('width').description).toContain('does not stretch')
    expect(prop('height').type).toBe('Dimension')
    expect(prop('height').description).toContain('two border rows')
    expect(prop('ref')).toEqual({
      name: 'ref',
      type: 'React.Ref<ToggleGroup>',
      description: 'Reference to the underlying Core ToggleGroup',
      availability: 'react',
    })
  })

  it('matches documented default sizing, segment padding, and incomplete vertical mode', () => {
    const props = {titles: ['Left', 'Center', 'Right'], selected: [1]}
    const group = new ToggleGroup(props)
    expect(group.naturalSize(Size.zero)).toEqual(new Size(25, 3))
    expect(
      new ToggleGroup({...props, padding: 0}).naturalSize(Size.zero),
    ).toEqual(new Size(19, 3))
    // Explicit padding affects both segment content and inherited View padding.
    expect(
      new ToggleGroup({...props, padding: 2}).naturalSize(Size.zero),
    ).toEqual(new Size(35, 9))
    group.titles = ['Up', 'Down']
    expect(group.naturalSize(Size.zero)).toEqual(new Size(13, 3))

    const onChange = vi.fn()
    const vertical = new ToggleGroup({
      ...props,
      direction: 'vertical',
      onChange,
    })
    expect(vertical.naturalSize(Size.zero)).toEqual(new Size(8, 13))
    const t = testRender(vertical, {width: 8, height: 13})
    try {
      expect(t.terminal.textContent().trim()).toBe('')
      t.sendMouse('mouse.button.down', {x: 1, y: 1})
      t.sendMouse('mouse.button.up', {x: 1, y: 1})
      expect(onChange).not.toHaveBeenCalled()
    } finally {
      vertical.screen?.stop()
    }
  })

  it('uses the public Core update API silently and reports changed index plus ordered selection', () => {
    const onChange = vi.fn()
    const props = {titles: ['A', 'B', 'C'], selected: [0, 0, 2], onChange}
    const group = new ToggleGroup(props)
    const t = testRender(group, {width: 20, height: 3})
    const click = (x: number) => {
      t.sendMouse('mouse.button.down', {x, y: 1})
      t.sendMouse('mouse.button.up', {x, y: 1})
    }
    try {
      expect(onChange).not.toHaveBeenCalled()
      // Input indices are deduplicated, not normalized to one selected item.
      click(1)
      expect(onChange).toHaveBeenLastCalledWith(0, [2])
      click(5)
      expect(onChange).toHaveBeenLastCalledWith(1, [1])
      click(5)
      expect(onChange).toHaveBeenLastCalledWith(1, [])

      onChange.mockClear()
      group.update({...props, multiple: true, selected: [0, 0, 2]})
      t.render()
      expect(onChange).not.toHaveBeenCalled()
      click(5)
      expect(onChange).toHaveBeenLastCalledWith(1, [0, 2, 1])
      click(1)
      expect(onChange).toHaveBeenLastCalledWith(0, [2, 1])
      click(1)
      expect(onChange).toHaveBeenLastCalledWith(0, [2, 1, 0])
      // Callback arrays are copies: mutating one cannot alter internal selection.
      onChange.mock.lastCall![1].length = 0
      click(5)
      expect(onChange).toHaveBeenLastCalledWith(1, [2, 0])
    } finally {
      group.screen?.stop()
    }
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact deterministic public sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/toggle-group.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(toggleGroupExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).toContain('const INITIAL_SINGLE = [1]')
      expect(source).toContain('const INITIAL_MULTIPLE = [0, 2]')
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|tui-|createElement|setTimeout|setInterval|Math\.random|Date\.|\.\.\//,
      )
      if (framework === 'core') {
        expect(source).toContain('new ToggleGroup({')
        expect(source).toContain('multiple: false')
        expect(source).toContain('multiple: true')
        expect(source).toContain('singleSummary.text =')
        expect(source).toContain('multipleSummary.text =')
        expect(source).toContain('width: 36')
        expect(source).toContain('height: 11')
        expect(source).toContain('await Screen.start(examples)')
      } else {
        expect(source).toContain('<Stack.down width={36} height={11}>')
        expect(source).toContain('<ToggleGroup')
        expect(source).toContain('multiple={false}')
        expect(source).toContain('multiple={true}')
        expect(source).toContain('useState(INITIAL_SINGLE)')
        expect(source).toContain('useState(INITIAL_MULTIPLE)')
        expect(source).toContain(
          'onChange={(_changed, selected) => setSingle(selected)}',
        )
        expect(source).toContain(
          'onChange={(_changed, selected) => setMultiple(selected)}',
        )
        expect(source).toContain('await run(<App />)')
        expect(source).not.toContain("from '@teaui/core'")
      }

      const start = Screen.start
      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await toggleGroupExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(output).toBe(await captureSpy.mock.results[0].value)
      expect(Screen.start).toBe(start)
      const rendered = removeAnsi(output)
      const lines = rendered.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(lines[0].trimEnd()).toBe('Single selection (click to toggle)')
      expect(lines[2]).toContain('Left')
      expect(lines[2]).toContain('Center')
      expect(lines[2]).toContain('Right')
      expect(lines[4].trimEnd()).toBe('Single: Center')
      expect(lines[5].trimEnd()).toBe('Multiple selection')
      expect(lines[7]).toContain('Bold')
      expect(lines[7]).toContain('Italic')
      expect(lines[7]).toContain('Underline')
      expect(lines[9].trimEnd()).toBe('Multiple: Bold, Underline')
      expect(lines[10].trimEnd()).toBe('Click again to clear an option')
      expect(rendered).toMatchSnapshot()
      expect(await toggleGroupExample.render[framework]()).toBe(output)
      expect(captureSpy).toHaveBeenNthCalledWith(2, moduleUrl, SIZE)
    },
  )

  it('captures identical visible Core and JSX React output', async () => {
    // The capture hook temporarily replaces Screen.start: do not run in parallel.
    const core = await toggleGroupExample.render.core()
    const react = await toggleGroupExample.render.react()
    expect(removeAnsi(react)).toBe(removeAnsi(core))
  })

  it.each(['core', 'react'] as const)(
    '%s executable sample replaces, adds, and clears selections through public mouse input',
    async framework => {
      const stopSpy = vi.spyOn(Screen.prototype, 'stop')
      await toggleGroupExample.render[framework]()
      const screen = stopSpy.mock.contexts[0]
      if (!(screen instanceof Screen)) {
        throw new Error('Sample did not stop a TeaUI screen')
      }
      const root = screen.rootView
      stopSpy.mockRestore()
      const t = testRender(root, SIZE)
      const label = (row: number) =>
        t.terminal.textContent().split('\n')[row].trimEnd()
      const click = (x: number, y: number) => {
        t.sendMouse('mouse.button.down', {x, y})
        t.sendMouse('mouse.button.up', {x, y})
      }
      try {
        expect(label(4)).toBe('Single: Center')
        expect(label(9)).toBe('Multiple: Bold, Underline')
        const selectedBackground = t.terminal.styleOf('Center')!.background
        expect(t.terminal.styleOf('Left')!.background).not.toEqual(
          selectedBackground,
        )
        expect(t.terminal.styleOf('Bold')!.background).toEqual(
          selectedBackground,
        )
        expect(t.terminal.styleOf('Italic')!.background).not.toEqual(
          selectedBackground,
        )
        expect(t.terminal.styleOf('Underline')!.background).toEqual(
          selectedBackground,
        )

        t.sendKey('tab')
        t.sendKey('space')
        t.sendKey('return')
        expect(label(4)).toBe('Single: Center')
        expect(label(9)).toBe('Multiple: Bold, Underline')

        click(20, 2)
        await vi.waitFor(() => {
          t.render()
          expect(label(4)).toBe('Single: Right')
        })
        expect(t.terminal.styleOf('Center')!.background).not.toEqual(
          selectedBackground,
        )
        expect(t.terminal.styleOf('Right')!.background).toEqual(
          selectedBackground,
        )
        expect(label(9)).toBe('Multiple: Bold, Underline')
        click(20, 2)
        await vi.waitFor(() => {
          t.render()
          expect(label(4)).toBe('Single: none')
        })
        expect(t.terminal.styleOf('Right')!.background).not.toEqual(
          selectedBackground,
        )

        click(10, 7)
        await vi.waitFor(() => {
          t.render()
          expect(label(9)).toBe('Multiple: Bold, Underline, Italic')
        })
        expect(t.terminal.styleOf('Italic')!.background).toEqual(
          selectedBackground,
        )
        expect(t.terminal.textContent()).toMatchSnapshot()

        click(2, 7)
        await vi.waitFor(() => {
          t.render()
          expect(label(9)).toBe('Multiple: Underline, Italic')
        })
        click(20, 7)
        await vi.waitFor(() => {
          t.render()
          expect(label(9)).toBe('Multiple: Italic')
        })
        click(10, 7)
        await vi.waitFor(() => {
          t.render()
          expect(label(9)).toBe('Multiple: none')
        })
        for (const title of ['Bold', 'Italic', 'Underline']) {
          expect(t.terminal.styleOf(title)!.background).not.toEqual(
            selectedBackground,
          )
        }
        expect(t.terminal.textContent()).toMatchSnapshot()
      } finally {
        root.screen?.stop()
      }
      const fresh = removeAnsi(await toggleGroupExample.render[framework]())
      expect(fresh.split('\n')[4].trimEnd()).toBe('Single: Center')
      expect(fresh.split('\n')[9].trimEnd()).toBe('Multiple: Bold, Underline')
    },
  )
})
