import {describe, expect, it} from 'vitest'
import {decodeMessage} from '../lib/protocol.js'
import {isSystemEvent} from '../lib/validate.js'

const modifiers = {ctrl: false, alt: false, gui: false, shift: false}
const mouse = {
  type: 'mouse',
  name: 'mouse.move.in',
  x: -1,
  y: -2,
  button: 'left',
  ...modifiers,
}
const key = {type: 'key', name: 'x', char: 'x', full: 'x', ...modifiers}

describe('remote message decoding', () => {
  it.each([
    mouse,
    key,
    {type: 'paste', text: 'hello 🌍'},
    {type: 'focus'},
    {type: 'blur'},
    {type: 'resize'},
    {type: 'snapshot', format: 'plain'},
    {type: 'snapshot', format: 'ansi'},
  ])('decodes %j without transport side effects', event => {
    expect(decodeMessage(JSON.stringify(event), false)).toEqual({
      ok: true,
      value: event,
    })
  })
  it('distinguishes binary input, broken JSON, and invalid events', () => {
    expect(decodeMessage('', true)).toMatchObject({
      ok: false,
      error: {type: 'binary-message'},
    })
    expect(decodeMessage('{', false)).toMatchObject({
      ok: false,
      error: {type: 'invalid-json'},
    })
    expect(decodeMessage('{}', false)).toMatchObject({
      ok: false,
      error: {type: 'invalid-event', reason: 'shape'},
    })
  })
  it.each([undefined, null, 'both', 'text', 0])(
    'rejects snapshot format %j',
    format => {
      expect(
        decodeMessage(JSON.stringify({type: 'snapshot', format}), false),
      ).toMatchObject({
        ok: false,
        error: {type: 'invalid-event', reason: 'snapshot-format'},
      })
    },
  )
  it('validates modifiers, coordinates and system-level mouse names', () => {
    expect(isSystemEvent(mouse)).toBe(true)
    expect(isSystemEvent({type: 'snapshot'})).toBe(false) // Protocol request, not input.
    for (const invalid of [
      {...mouse, x: Infinity},
      {...mouse, x: 1.5},
      {...mouse, name: 'mouse.button.dragInside'},
      {...mouse, button: 'nope'},
      {...key, ctrl: 1},
      {...key, full: ''},
    ]) {
      expect(isSystemEvent(invalid)).toBe(false)
    }
  })
})
