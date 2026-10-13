import {afterEach, describe, expect, it, vi} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import type {Screen} from '../../lib/Screen.js'
import {Checkbox} from '../../lib/components/Checkbox.js'
import {Input} from '../../lib/components/Input.js'
import {Scrollable} from '../../lib/components/Scrollable.js'
import {Stack} from '../../lib/components/Stack.js'
import {Text} from '../../lib/components/Text.js'

const screens: Screen[] = []
afterEach(() => {
  vi.restoreAllMocks()
  for (const screen of screens.splice(0)) {
    screen.stop()
  }
})

function setup(checkbox: Checkbox) {
  const first = new Input({value: 'first'})
  const scroll = new Scrollable({
    showScrollbars: false,
    children: [
      Stack.down([
        first,
        new Text({text: 'line\n'.repeat(10)}),
        checkbox,
        // Keep this rendering test independent of scroll-boundary clamping.
        new Text({text: 'after checkbox'}),
      ]),
    ],
  })
  const t = testRender(scroll, {width: 24, height: 4})
  screens.push(scroll.screen!)
  return {t, first, scroll}
}

describe('offscreen Checkbox drawing', () => {
  it('retains focus, label geometry/listeners and checked state while skipping drawing', () => {
    let changes = 0
    let hotkeys = 0
    const checkbox = new Checkbox({
      title: 'Option',
      value: false,
      onChange: () => changes++,
    })
    checkbox.purpose = checkbox.purpose.merge({})
    const ui = vi.spyOn(checkbox.purpose, 'ui')
    const label = checkbox.children[0]
    label.addKeyboardListener(() => hotkeys++, {events: ['ctrl+y']})
    const {t, first, scroll} = setup(checkbox)
    expect(first.hasFocus).toBe(true)
    const size = label.contentSize
    const origin = label.origin
    ui.mockClear()
    t.render()
    expect(ui).not.toHaveBeenCalled()
    expect(label.contentSize).toEqual(size)
    expect(label.origin).toEqual(origin)
    expect(checkbox.contentSize.isEmpty).toBe(false)
    t.sendKey('y', {ctrl: true})
    expect(hotkeys).toBe(1)
    t.sendKey('tab')
    expect(checkbox.hasFocus).toBe(true)
    t.sendKey('space')
    expect(checkbox.value).toBe(true)
    expect(changes).toBe(1)
    scroll.scrollTo(checkbox)
    t.render()
    expect(t.terminal.textContent()).toContain('◼︎ Option')
    // Toggle by mouse after the checked checkbox becomes visible.
    const row = t.terminal
      .textContent()
      .split('\n')
      .findIndex(line => line.includes('Option'))
    t.sendMouse('mouse.button.down', {x: 0, y: row})
    t.sendMouse('mouse.button.up', {x: 0, y: row})
    expect(checkbox.value).toBe(false)
    expect(changes).toBe(2)
    expect(t.terminal.textContent()).toContain('☐ Option')
  })

  it('keeps the original rendering path for subclasses with additional children', () => {
    class CustomCheckbox extends Checkbox {
      constructor() {
        super({title: 'Option', value: false})
        this.add(new Text({text: 'custom'}))
      }
    }
    const checkbox = new CustomCheckbox()
    checkbox.purpose = checkbox.purpose.merge({})
    const ui = vi.spyOn(checkbox.purpose, 'ui')
    const {t} = setup(checkbox)
    ui.mockClear()
    t.render()
    expect(ui).toHaveBeenCalled()
  })
})
