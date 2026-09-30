import {describe, expect, it} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {FontStyle, type FontStyleValue} from '../../lib/components/FontStyle.js'

const NONE: FontStyleValue = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
}
const ALL: FontStyleValue = {
  bold: true,
  italic: true,
  underline: true,
  strikethrough: true,
}
const SELECTED_BACKGROUND = [97, 97, 97]

describe('FontStyle', () => {
  describe('rendering', () => {
    it('renders with none selected', () => {
      const t = testRender(new FontStyle({value: NONE}), {width: 30, height: 3})

      expect(t.terminal.textContent()).toMatchSnapshot()
      expect(t.terminal.styleOf('B')?.bold).toBe(true)
      expect(t.terminal.styleOf('I')?.italic).toBe(true)
      expect(t.terminal.styleOf('U')?.underline).toBe(true)
      expect(t.terminal.styleOf('S')?.strikeout).toBe(true)
      for (const label of ['B', 'I', 'U', 'S']) {
        expect(t.terminal.styleOf(label)?.background).not.toEqual(
          SELECTED_BACKGROUND,
        )
      }
    })

    it('renders with one selected', () => {
      const t = testRender(new FontStyle({value: {...NONE, italic: true}}), {
        width: 30,
        height: 3,
      })

      expect(t.terminal.textContent()).toMatchSnapshot()
      expect(t.terminal.styleOf('I')?.background).toEqual(SELECTED_BACKGROUND)
      for (const label of ['B', 'U', 'S']) {
        expect(t.terminal.styleOf(label)?.background).not.toEqual(
          SELECTED_BACKGROUND,
        )
      }
    })

    it('renders with all selected', () => {
      const t = testRender(new FontStyle({value: ALL}), {width: 30, height: 3})

      expect(t.terminal.textContent()).toMatchSnapshot()
      for (const label of ['B', 'I', 'U', 'S']) {
        expect(t.terminal.styleOf(label)?.background).toEqual(
          SELECTED_BACKGROUND,
        )
      }
    })
  })

  it('calls onChange with the selected styles', () => {
    let value: FontStyleValue | undefined
    const fontStyle = new FontStyle({
      value: NONE,
      onChange: next => (value = next),
    })
    const t = testRender(fontStyle, {width: 30, height: 3})

    t.sendMouse('mouse.button.down', {x: 1, y: 1})
    t.sendMouse('mouse.button.up', {x: 1, y: 1})

    expect(value).toEqual({...NONE, bold: true})
    expect(fontStyle.value).toEqual({...NONE, bold: true})
  })

  it('updates the ToggleGroup when value changes', () => {
    const fontStyle = new FontStyle({value: NONE})
    const t = testRender(fontStyle, {width: 30, height: 3})

    fontStyle.value = {...NONE, italic: true}
    t.render()

    expect(t.terminal.styleOf('I')?.background).toEqual(SELECTED_BACKGROUND)
  })
})
