import {describe, expect, it, vi} from 'vitest'
import {Text} from '../../lib/components/Text.js'
import {Buffer} from '../../lib/Buffer.js'
import {Viewport} from '../../lib/Viewport.js'
import {Screen} from '../../lib/Screen.js'
import {TestProgram} from '../../lib/TestProgram.js'
import {StringTerminal} from '../../lib/StringTerminal.js'
import {Style} from '../../lib/Style.js'
import {Point, Rect, Size} from '../../lib/geometry.js'

function draw(
  view: Text,
  width: number,
  parentStyle = Style.NONE,
  clipped = false,
) {
  const size = new Size(width, 6)
  const program = new TestProgram({cols: width, rows: size.height})
  const screen = new Screen(program, view)
  const buffer = new Buffer()
  buffer.resize(size)
  const viewport = new Viewport(screen, buffer, size)
  const render = () =>
    viewport.usingPen(parentStyle, () => view.render(viewport))
  if (clipped) {
    viewport.clipped(
      new Rect(new Point(-2, -1), new Size(width + 3, 7)),
      render,
    )
  } else {
    render()
  }
  buffer.flush(new StringTerminal({cols: width, rows: size.height}))
  return buffer.snapshot()
}

// These goldens were generated with the unoptimized renderer before introducing
// a parsing cache. They deliberately retain exact ANSI serialization, not just
// printable text, including resets, RGB colors, clipping and mapped-font output.
describe('Text parsing compatibility', () => {
  it('reuses parsed deltas until text, default style or wrapped layout changes', () => {
    const parse = vi.spyOn(Style, 'fromSGR')
    try {
      const style = new Style({foreground: 'yellow'})
      const text = new Text({
        text: '\x1b[31mred\x1b[39m more words',
        style,
        wrap: true,
      })
      draw(text, 19)
      expect(parse).toHaveBeenCalledTimes(2)
      draw(text, 19)
      expect(parse).toHaveBeenCalledTimes(2)
      style.foreground = 'blue'
      draw(text, 19)
      expect(parse).toHaveBeenCalledTimes(4)
      draw(text, 9)
      expect(parse).toHaveBeenCalledTimes(6)
      draw(text, 19)
      // Only the current layout is retained, not a cache growing with widths.
      expect(parse).toHaveBeenCalledTimes(8)
      text.text += '!'
      draw(text, 19)
      expect(parse).toHaveBeenCalledTimes(10)
    } finally {
      parse.mockRestore()
    }
  })

  for (const width of [7, 19, 41]) {
    for (const wrap of [false, true]) {
      it(`retains styled/Unicode output across updates at width ${width}, wrap=${wrap}`, () => {
        const content =
          '🇺🇳 👨‍👩‍👧‍👦 e\u0301 \x1b[38;2;9;27;81mRGB\x1b[39m\n' +
          '\x1b[1mbold\x1b[22m long words carry and wrap\n\x1b[31mred\ncarry\x1b[0m plain'
        const style = new Style({
          bold: true,
          foreground: 'yellow',
          background: [5, 10, 15],
        })
        const text = new Text({
          text: content,
          style,
          wrap,
          alignment: wrap ? 'center' : 'right',
        })
        const frames = [draw(text, width), draw(text, width)]
        style.bold = false
        style.foreground = 'cyan'
        frames.push(draw(text, width))
        frames.push(
          draw(text, width, new Style({italic: true, background: 'red'})),
        )
        frames.push(draw(text, width + 5), draw(text, width))
        frames.push(draw(text, width, Style.NONE, true))
        text.text = '\x1b[4mchanged\x1b[24m 界\n\x1b[48;5;35mnew\x1b[49m'
        frames.push(draw(text, width))
        text.font = 'bold'
        frames.push(draw(text, width))
        text.font = 'default'
        frames.push(draw(text, width))
        text.update({lines: ['a\x1b[32mb', 'c\x1b[0md'], wrap: !wrap})
        frames.push(draw(text, width))
        expect(frames).toMatchSnapshot()
      })
    }
  }
})
