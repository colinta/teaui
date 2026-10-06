import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Text} from '../../lib/components/Text.js'
import {Style} from '../../lib/Style.js'
import {Size} from '../../lib/geometry.js'

describe('Text', () => {
  describe('wrapped naturalSize', () => {
    // the measured height must match the number of rows that are drawn
    it.each([
      // word wrapping needs more rows than a character count suggests
      [
        'This column ends two cells before the widest card. Drag the sliders to resize the cards, and it reflows in the same render: the Placement is pinned to an Alignment marker at the top-left of the card column. No Geometry callbacks, no extra state.',
        50,
        6,
      ],
      // ...or fewer, because the space at the break isn't drawn
      ['abcde fghij', 5, 2],
      // blank lines take up a row
      ['a\n\nb', 5, 3],
    ])('%j at width %i is %i rows', (text, width, rows) => {
      const view = new Text({text, wrap: true})
      expect(view.naturalSize(new Size(width, 20)).height).toBe(rows)
      const t = testRender(view, {width, height: 20})
      expect(t.terminal.textContent().split('\n').length).toBe(rows)
    })
  })

  describe('font', () => {
    it('maps letters and digits', () => {
      const t = testRender(new Text({text: 'ab 12', font: 'serif-bold'}), {
        width: 10,
        height: 1,
      })
      expect(t.terminal.textContent()).toBe('𝐚𝐛 𝟏𝟐')
    })

    it('does not map the characters of ANSI sequences', () => {
      const t = testRender(
        new Text({
          text: 'a\x1b[1mb\x1b[22m\x1b[38;5;196mc\x1b[39m',
          font: 'serif-bold',
        }),
        {width: 10, height: 1},
      )
      expect(t.terminal.textContent()).toBe('𝐚𝐛𝐜')
      expect(t.terminal.styleAt(0, 0).bold).toBeFalsy()
      expect(t.terminal.styleAt(1, 0).bold).toBe(true)
      expect(t.terminal.styleAt(2, 0).bold).toBeFalsy()
      expect(t.terminal.styleAt(2, 0).foreground).toBeDefined()
      expect(t.terminal.styleAt(1, 0).foreground).toBeUndefined()
    })

    it('measures mapped text without the ANSI sequences', () => {
      const text = new Text({
        text: '\x1b[1m12\x1b[22m',
        font: 'serif-bold',
      })
      const t = testRender(text, {width: 10, height: 1})
      expect(t.terminal.textContent()).toBe('𝟏𝟐')
      expect(text.naturalSize(new Size(10, 1))).toEqual(new Size(2, 1))
    })
  })

  it('renders text content', () => {
    const t = testRender(new Text({text: 'Hello, world!'}), {
      width: 20,
      height: 1,
    })
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders bold text', () => {
    const t = testRender(new Text({text: 'Bold', style: Style.bold}), {
      width: 10,
      height: 1,
    })
    expect(t.terminal.charAt(0, 0)).toBe('B')
    expect(t.terminal.styleAt(0, 0).bold).toBe(true)
  })

  it('renders italic text', () => {
    const t = testRender(
      new Text({text: 'Italic', style: new Style({italic: true})}),
      {width: 10, height: 1},
    )
    expect(t.terminal.styleOf('Italic')!.italic).toBe(true)
  })

  it('renders underlined text', () => {
    const t = testRender(new Text({text: 'Under', style: Style.underlined}), {
      width: 10,
      height: 1,
    })
    expect(t.terminal.styleOf('Under')!.underline).toBe(true)
  })

  it('wraps long text when wrap is enabled', () => {
    const t = testRender(new Text({text: 'Hello World', wrap: true}), {
      width: 6,
      height: 3,
    })
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('truncates long text when wrap is disabled', () => {
    const t = testRender(new Text({text: 'Hello World'}), {width: 5, height: 1})
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders multiline text from lines array', () => {
    const t = testRender(new Text({lines: ['Line 1', 'Line 2', 'Line 3']}), {
      width: 10,
      height: 3,
    })
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders empty text without crashing', () => {
    const t = testRender(new Text({text: ''}), {width: 10, height: 1})
    expect(t.terminal.textContent()).toBe('')
  })
})
