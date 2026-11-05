import {describe, expect, it} from 'vitest'

import {testRender} from '../../lib/TestScreen.js'
import {Style} from '../../lib/Style.js'
import {Label} from '../../lib/components/Label.js'

describe('Label', () => {
  it('renders its text', () => {
    const label = new Label({for: 'name', text: 'Name'})
    const t = testRender(label, {width: 10, height: 1})
    expect(t.terminal.textContent()).toBe('Name')
    expect(label.for).toBe('name')
    expect(label.isValid).toBe(true)
    expect(t.terminal.styleOf('Name')?.foreground).toBeUndefined()
    expect(t.terminal.styleOf('Name')?.bold).toBe(true)
  })

  it('renders red bold italics when invalid, and restores its style when valid', () => {
    const style = new Style({underline: true})
    const label = new Label({for: 'name', text: 'Name', style})
    const t = testRender(label, {width: 10, height: 1})

    label.isValid = false
    t.render()
    expect(t.terminal.styleOf('Name')).toMatchObject({
      foreground: 'red',
      italic: true,
      bold: true,
      underline: true,
    })
    // the style property is still the style that was assigned
    expect(label.style).toBe(style)

    label.isValid = true
    t.render()
    expect(t.terminal.styleOf('Name')?.foreground).toBeUndefined()
    expect(t.terminal.styleOf('Name')?.italic).not.toBe(true)
    expect(t.terminal.styleOf('Name')).toMatchObject({
      bold: true,
      underline: true,
    })
  })

  it('keeps the error style when its style or props change', () => {
    const label = new Label({for: 'name', text: 'Name'})
    const t = testRender(label, {width: 10, height: 1})
    label.isValid = false

    label.style = new Style({underline: true})
    t.render()
    expect(t.terminal.styleOf('Name')).toMatchObject({
      foreground: 'red',
      italic: true,
      underline: true,
    })

    label.update({for: 'email', text: 'Email'})
    t.render()
    expect(label.for).toBe('email')
    expect(t.terminal.styleOf('Email')).toMatchObject({
      foreground: 'red',
      italic: true,
    })
  })
})
