import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Progress} from '../../lib/components/Progress.js'

describe('Progress', () => {
  it('renders empty progress bar', () => {
    const t = testRender(new Progress({value: 0}), {width: 10, height: 1})
    const content = t.terminal.textContent()
    expect(content.length).toBeGreaterThan(0)
  })

  it('renders full progress bar', () => {
    const t = testRender(new Progress({value: 1}), {width: 10, height: 1})
    const content = t.terminal.textContent()
    expect(content.length).toBeGreaterThan(0)
  })

  it('renders half progress bar', () => {
    const t = testRender(new Progress({value: 0.5}), {width: 10, height: 1})
    const content = t.terminal.textContent()
    expect(content.length).toBeGreaterThan(0)
  })
})
