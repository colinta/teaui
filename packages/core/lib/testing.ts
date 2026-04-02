/**
 * Test utilities for headless component rendering and interaction.
 *
 * Usage:
 *   const t = testRender(<view>, {width: 40, height: 10})
 *   expect(t.terminal.textContent()).toContain('Hello')
 *   expect(t.terminal.styleOf('Hello')?.bold).toBe(true)
 *
 *   t.sendKey('a')
 *   t.sendKey('tab')
 *   t.sendKey('return', {ctrl: true})
 *   t.sendMouse('mouse.button.down', {x: 5, y: 2})
 *
 *   // Re-renders automatically after events, query again:
 *   expect(t.terminal.charAt(0, 0)).toBe('a')
 */
import {type KeyName} from '@teaui/term'
import type {TestTerminal} from './TestTerminal.js'
import type {View} from './View.js'
import {Screen} from './Screen.js'
import {TestProgram} from './TestProgram.js'
import type {KeyEvent, SystemMouseEvent} from './events/index.js'

class TestScreen {
  #screen: Screen
  #program: TestProgram

  constructor(
    view: View,
    readonly options: {width: number; height: number; isFocused?: boolean},
  ) {
    this.#program = new TestProgram({
      cols: options.width,
      rows: options.height,
    })
    this.#screen = new Screen(this.#program, view, {
      isFocused: options.isFocused !== false,
    })
    this.#screen.start()
  }

  get terminal(): TestTerminal {
    return this.#program.terminal
  }

  get view(): View {
    return this.#screen.rootView
  }

  /**
   * Advance time by `dt` milliseconds, triggering any registered tick
   * animations and re-rendering.
   */
  tick(dt: number) {
    this.#screen.tick(dt)
  }

  render() {
    this.#screen.render()
  }

  sendKey(
    key: KeyName,
    mods: {ctrl?: boolean; alt?: boolean; gui?: boolean; shift?: boolean} = {},
  ) {
    const ctrl = mods.ctrl ?? false
    const alt = mods.alt ?? false
    const gui = mods.gui ?? false
    const shift = mods.shift ?? false

    let full = ''
    if (ctrl) full += 'C-'
    if (alt) full += 'A-'
    if (gui) full += 'G-'
    if (shift) full += 'S-'
    full += key

    const char = key === 'space' ? ' ' : key.length === 1 ? key : ''

    const event: KeyEvent = {
      type: 'key',
      name: key,
      char,
      full: full as import('./events/index.js').FullKeyName,
      ctrl,
      alt,
      gui,
      shift,
    }

    this.#screen.trigger(event)
  }

  sendMouse(
    name: SystemMouseEvent['name'],
    pos: {x: number; y: number},
    mods: {ctrl?: boolean; alt?: boolean; gui?: boolean; shift?: boolean} = {},
  ) {
    const button = name.startsWith('mouse.wheel')
      ? ('wheel' as const)
      : name === 'mouse.move.in'
        ? ('unknown' as const)
        : ('left' as const)

    const event: SystemMouseEvent = {
      type: 'mouse',
      name,
      x: pos.x,
      y: pos.y,
      ctrl: mods.ctrl ?? false,
      alt: mods.alt ?? false,
      gui: mods.gui ?? false,
      shift: mods.shift ?? false,
      button,
    }

    this.#screen.trigger(event)
  }

  sendPaste(text: string) {
    this.#screen.trigger({type: 'paste', text})
  }
}

/**
 * Render a component headlessly and return a test harness for interaction testing.
 *
 * @example
 * ```ts
 * const t = testRender(new Input({value: 'hello'}), {width: 20, height: 1})
 * expect(t.terminal.textContent()).toContain('hello')
 * t.sendKey('!') // type a character
 * expect(t.terminal.textContent()).toContain('hello!')
 * ```
 */
export function testRender(
  view: View,
  size: {width: number; height: number; isFocused?: boolean},
): TestScreen {
  return new TestScreen(view, size)
}
