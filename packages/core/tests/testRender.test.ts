import {describe, it, expect} from 'vitest'
import {testRender} from '../lib/testing.js'
import {Text} from '../lib/components/Text.js'
import {Input} from '../lib/components/Input.js'
import {Style} from '../lib/Style.js'

/**
 * Smoke tests for the testRender harness itself.
 * Component-specific tests are in tests/components/*.test.ts
 */
describe('testRender harness', () => {
  it('renders a component and produces queryable output', () => {
    const t = testRender(new Text({text: 'Hello'}), {width: 10, height: 1})
    expect(t.terminal.textContent()).toBe('Hello')
    expect(t.terminal.charAt(0, 0)).toBe('H')
  })

  it('delivers keyboard events and re-renders', () => {
    let value = ''
    const input = new Input({
      value: '',
      onChange(v) {
        value = v
      },
    })
    const t = testRender(input, {width: 20, height: 1})
    t.sendKey('x')
    expect(value).toBe('x')
    expect(t.terminal.textContent()).toContain('x')
  })

  it('captures styles from rendering', () => {
    const t = testRender(
      new Text({text: 'styled', style: new Style({italic: true})}),
      {width: 10, height: 1},
    )
    expect(t.terminal.styleOf('styled')!.italic).toBe(true)
  })
})
