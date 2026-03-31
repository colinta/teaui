import {describe, test, expect} from 'vitest'
import type {
  KeyEvent as TermKeyEvent,
  MouseEvent as TermMouseEvent,
} from '@teaui/term'
import {
  translateTermKeyEvent,
  translateTermMouseEvent,
} from '../lib/events/translate.js'

function termKey(
  key: string,
  mods: {ctrl?: boolean; alt?: boolean; shift?: boolean; gui?: boolean} = {},
): TermKeyEvent {
  return {
    type: 'key',
    key,
    ctrl: mods.ctrl ?? false,
    alt: mods.alt ?? false,
    shift: mods.shift ?? false,
    gui: mods.gui ?? false,
  }
}

function termMouse(
  action: TermMouseEvent['action'],
  button: TermMouseEvent['button'] = 'none',
  opts: {
    x?: number
    y?: number
    ctrl?: boolean
    alt?: boolean
    shift?: boolean
  } = {},
): TermMouseEvent {
  return {
    type: 'mouse',
    action,
    button,
    x: opts.x ?? 0,
    y: opts.y ?? 0,
    ctrl: opts.ctrl ?? false,
    alt: opts.alt ?? false,
    shift: opts.shift ?? false,
  }
}

describe('translateTermKeyEvent', () => {
  test('simple character', () => {
    const result = translateTermKeyEvent(termKey('a'))
    expect(result).toEqual({
      type: 'key',
      name: 'a',
      char: 'a',
      ctrl: false,
      alt: false,
      gui: false,
      shift: false,
      full: 'a',
    })
  })

  test('named key has empty char', () => {
    const result = translateTermKeyEvent(termKey('escape'))
    expect(result.char).toBe('')
    expect(result.name).toBe('escape')
    expect(result.full).toBe('escape')
  })

  test('ctrl modifier', () => {
    const result = translateTermKeyEvent(termKey('c', {ctrl: true}))
    expect(result.ctrl).toBe(true)
    expect(result.full).toBe('C-c')
  })

  test('alt maps to alt', () => {
    const result = translateTermKeyEvent(termKey('x', {alt: true}))
    expect(result.alt).toBe(true)
    expect(result.gui).toBe(false)
    expect(result.full).toBe('A-x')
  })

  test('gui maps to gui', () => {
    const result = translateTermKeyEvent(termKey('x', {gui: true}))
    expect(result.gui).toBe(true)
    expect(result.alt).toBe(false)
    expect(result.full).toBe('G-x')
  })

  test('shift modifier', () => {
    const result = translateTermKeyEvent(termKey('tab', {shift: true}))
    expect(result.shift).toBe(true)
    expect(result.full).toBe('S-tab')
  })

  test('combined modifiers', () => {
    const result = translateTermKeyEvent(
      termKey('a', {ctrl: true, alt: true, shift: true}),
    )
    expect(result.full).toBe('C-A-S-a')
    expect(result.ctrl).toBe(true)
    expect(result.alt).toBe(true)
    expect(result.gui).toBe(false)
    expect(result.shift).toBe(true)
  })
})

describe('translateTermMouseEvent', () => {
  test('press maps to mouse.button.down', () => {
    const result = translateTermMouseEvent(termMouse('press', 'left'))
    expect(result).toBeDefined()
    expect(result!.name).toBe('mouse.button.down')
    expect(result!.button).toBe('left')
  })

  test('release maps to mouse.button.up', () => {
    const result = translateTermMouseEvent(termMouse('release', 'left'))
    expect(result).toBeDefined()
    expect(result!.name).toBe('mouse.button.up')
    expect(result!.button).toBe('left')
  })

  test('move maps to mouse.move.in', () => {
    const result = translateTermMouseEvent(termMouse('move', 'none'))
    expect(result).toBeDefined()
    expect(result!.name).toBe('mouse.move.in')
  })

  test('drag maps to mouse.button.down (not mouse.move.in)', () => {
    const result = translateTermMouseEvent(termMouse('drag', 'left'))
    expect(result).toBeDefined()
    expect(result!.name).toBe('mouse.button.down')
    expect(result!.button).toBe('left')
  })

  test('scrollUp maps to mouse.wheel.up', () => {
    const result = translateTermMouseEvent(termMouse('scrollUp', 'none'))
    expect(result).toBeDefined()
    expect(result!.name).toBe('mouse.wheel.up')
    expect(result!.button).toBe('wheel')
  })

  test('scrollDown maps to mouse.wheel.down', () => {
    const result = translateTermMouseEvent(termMouse('scrollDown', 'none'))
    expect(result).toBeDefined()
    expect(result!.name).toBe('mouse.wheel.down')
    expect(result!.button).toBe('wheel')
  })

  test('preserves coordinates', () => {
    const result = translateTermMouseEvent(
      termMouse('press', 'left', {x: 10, y: 20}),
    )
    expect(result!.x).toBe(10)
    expect(result!.y).toBe(20)
  })

  test('preserves modifiers', () => {
    const result = translateTermMouseEvent(
      termMouse('press', 'left', {ctrl: true, alt: true, shift: true}),
    )
    expect(result!.ctrl).toBe(true)
    expect(result!.alt).toBe(true)
    expect(result!.gui).toBe(false)
    expect(result!.shift).toBe(true)
  })

  test('middle button', () => {
    const result = translateTermMouseEvent(termMouse('press', 'middle'))
    expect(result!.button).toBe('middle')
  })

  test('right button', () => {
    const result = translateTermMouseEvent(termMouse('press', 'right'))
    expect(result!.button).toBe('right')
  })

  test('unknown button on non-move event returns undefined', () => {
    const result = translateTermMouseEvent(termMouse('press', 'none'))
    expect(result).toBeUndefined()
  })

  test('unknown button on move event is allowed', () => {
    const result = translateTermMouseEvent(termMouse('move', 'none'))
    expect(result).toBeDefined()
    expect(result!.button).toBe('unknown')
  })
})
