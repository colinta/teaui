import {readFileSync} from 'node:fs'
import {
  lineWidth,
  removeAnsi,
  Screen,
  Size,
  testRender,
  Toggle,
  type View,
} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {toggleExample} from '../lib/examples/samples/toggle.js'

const SIZE = {width: 32, height: 9}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('toggle CLI component example', () => {
  it('documents real boolean props, sizing, animation, and React-only refs', () => {
    expect(toggleExample.name).toBe('toggle')
    expect(toggleExample.availability).toBe('both')
    expect(toggleExample.description).toContain('Tab to focus')
    expect(toggleExample.description).toContain('fixed gray/green')
    for (const framework of ['core', 'react'] as const) {
      const props = toggleExample.props.filter(
        prop => prop.availability === 'both' || prop.availability === framework,
      )
      const names = props.map(prop => prop.name)
      expect(names).toEqual([
        'value',
        'onChange',
        'width',
        'height',
        ...(framework === 'react' ? ['ref'] : []),
      ])
      expect(new Set(names).size).toBe(names.length)
      for (const name of ['children', 'child', 'title', 'hotKey', 'disabled']) {
        expect(names).not.toContain(name)
      }
    }
    const prop = (name: string) =>
      toggleExample.props.find(prop => prop.name === name)!
    expect(prop('value').type).toBe('boolean')
    expect(prop('value').description).toContain('Defaults to false')
    expect(prop('value').description).toContain('without calling onChange')
    expect(prop('value').description).toContain('120 ms')
    expect(prop('onChange').type).toBe('(value: boolean) => void')
    expect(prop('onChange').description).toContain('Space/Enter')
    expect(prop('onChange').description).toContain('controlled toggle')
    expect(prop('width').type).toBe('Dimension')
    expect(prop('width').description).toContain('naturally 6')
    expect(prop('width').description).toContain('rather than stretching')
    expect(prop('height').type).toBe('Dimension')
    expect(prop('height').description).toContain('naturally 2')
    expect(prop('height').description).toContain('compact rendering')
    expect(prop('ref')).toEqual({
      name: 'ref',
      type: 'React.Ref<Toggle>',
      description: 'Reference to the underlying Core Toggle',
      availability: 'react',
    })
  })

  it('verifies documented defaults and the non-notifying Core value setter', () => {
    const onChange = vi.fn()
    const toggle = new Toggle({onChange})
    expect(toggle.value).toBe(false)
    expect(toggle.naturalSize(Size.zero)).toEqual(new Size(6, 2))
    const t = testRender(toggle, {width: 6, height: 2})
    toggle.value = true
    t.render()
    expect(toggle.value).toBe(true)
    expect(onChange).not.toHaveBeenCalled()
    t.tick(120)
    expect(t.terminal.textContent()).toBe('┌──▗▄▖\n└──▝▀▘')
    expect(new Toggle({height: 1}).naturalSize(Size.zero)).toEqual(
      new Size(6, 1),
    )
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact deterministic public sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/toggle.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(toggleExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|tui-|createElement|setTimeout|setInterval|Math\.random|Date\.|\.\.\//,
      )
      expect(source).toContain('const INITIAL_VALUE = false')
      if (framework === 'core') {
        expect(source).toContain('width: 32')
        expect(source).toContain('height: 9')
        expect(source).toContain(
          'new Toggle({value: false, width: 6, height: 2})',
        )
        expect(source).toContain(
          'new Toggle({value: true, width: 6, height: 2})',
        )
        expect(source).toContain(
          'new Toggle({value: false, width: 6, height: 1})',
        )
        expect(source).toContain(
          'new Toggle({value: true, width: 6, height: 1})',
        )
        expect(source).toContain('notifications.value = value')
        expect(source).toContain('summary.text = describeValue(value)')
        expect(source).toContain('await Screen.start(examples)')
      } else {
        expect(source).toContain('<Stack.down width={32} height={9}>')
        expect(source).toContain(
          '<Toggle value={false} width={6} height={2} />',
        )
        expect(source).toContain('<Toggle value={true} width={6} height={2} />')
        expect(source).toContain(
          '<Toggle value={false} width={6} height={1} />',
        )
        expect(source).toContain('<Toggle value={true} width={6} height={1} />')
        expect(source).toContain('useState(INITIAL_VALUE)')
        expect(source).toContain('onChange={setValue}')
        expect(source).toContain('await run(<App />)')
        expect(source).not.toContain("from '@teaui/core'")
      }

      const start = Screen.start
      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await toggleExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(output).toBe(await captureSpy.mock.results[0].value)
      expect(Screen.start).toBe(start)

      const rendered = removeAnsi(output)
      const lines = rendered.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(lines[0].trimEnd()).toBe('Normal: off / on')
      expect(lines[1].trimEnd()).toBe('┏━┓──┐  ┌──▗▄▖')
      expect(lines[2].trimEnd()).toBe('┗━┛──┘  └──▝▀▘')
      expect(lines[3].trimEnd()).toBe('Compact: off / on')
      expect(lines[4].trimEnd()).toBe('⬜︎╶──╴  ╶──╴⬛︎')
      expect(lines[5].trimEnd()).toBe('Notifications: off')
      expect(lines[6].trimEnd()).toBe('┏━┓──┐')
      expect(lines[7].trimEnd()).toBe('┗━┛──┘')
      expect(lines[8].trimEnd()).toBe('Click, or Tab then Space/Enter')
      expect(rendered).toMatchSnapshot()

      expect(await toggleExample.render[framework]()).toBe(output)
      expect(captureSpy).toHaveBeenNthCalledWith(2, moduleUrl, SIZE)
    },
  )

  it('captures identical visible Core and JSX React output', async () => {
    // captureExample temporarily replaces Screen.start: capture sequentially.
    const core = await toggleExample.render.core()
    const react = await toggleExample.render.react()
    expect(removeAnsi(react)).toBe(removeAnsi(core))
  })

  it.each(['core', 'react'] as const)(
    '%s executable sample updates its controlled label and animates through public input APIs',
    async framework => {
      let root: View | undefined
      const start = Screen.prototype.start
      vi.spyOn(Screen.prototype, 'start').mockImplementation(
        function (this: Screen) {
          root = this.rootView
          start.call(this)
        },
      )
      await toggleExample.render[framework]()
      expect(root).toBeDefined()
      const t = testRender(root!, SIZE)
      const label = () => t.terminal.textContent().split('\n')[5].trimEnd()
      expect(label()).toBe('Notifications: off')
      // The controlled switch follows the four normal/compact showcase switches.
      for (let index = 0; index < 5; index++) {
        t.sendKey('tab')
      }
      t.sendKey('a')
      expect(label()).toBe('Notifications: off')
      t.sendKey('space')
      expect(label()).toBe('Notifications: on')
      expect(t.terminal.charAt(0, 6)).toBe('▗')
      t.tick(120)
      expect(t.terminal.textRect(0, 6, 6, 2)).toBe('┌──▗▄▖\n└──▝▀▘')
      t.sendKey('return')
      expect(label()).toBe('Notifications: off')
      t.tick(120)
      expect(t.terminal.textRect(0, 6, 6, 2)).toBe('┏━┓──┐\n┗━┛──┘')
      t.sendMouse('mouse.button.down', {x: 2, y: 7})
      t.sendMouse('mouse.button.up', {x: 2, y: 7})
      expect(label()).toBe('Notifications: on')
      t.tick(120)
      expect(t.terminal.textRect(0, 6, 6, 2)).toBe('┌──▗▄▖\n└──▝▀▘')
      expect(t.terminal.styleAt(0, 6).foreground).toEqual([52, 199, 89])
      const fresh = removeAnsi(await toggleExample.render[framework]())
      expect(fresh.split('\n')[5].trimEnd()).toBe('Notifications: off')
    },
  )
})
