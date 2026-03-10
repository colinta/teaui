import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Header} from '../../lib/components/Header.js'

describe('Header', () => {
  it('renders header text with single border', () => {
    const t = testRender(new Header({text: 'Title', border: 'single'}), {
      width: 20,
      height: 2,
    })
    expect(t.terminal.textContent()).toContain('Title')
  })

  it('renders underline border', () => {
    const t = testRender(new Header({text: 'Title', border: 'single'}), {
      width: 20,
      height: 2,
    })
    // Second row should contain separator chars
    const borderRow = t.terminal.getRow(1)
    expect(borderRow).toMatch(/─/)
  })

  it('renders bold text when bold prop set', () => {
    const t = testRender(
      new Header({text: 'Bold', border: 'single', bold: true}),
      {width: 20, height: 2},
    )
    const style = t.terminal.styleOf('Bold')
    expect(style).not.toBeNull()
    expect(style!.bold).toBe(true)
  })

  it('renders double border', () => {
    const t = testRender(new Header({text: 'Title', border: 'double'}), {
      width: 20,
      height: 2,
    })
    const borderRow = t.terminal.getRow(1)
    expect(borderRow).toMatch(/═/)
  })
})
