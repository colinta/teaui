import {Screen, Stack, Style, Text} from '@teaui/core'

const WIDTH = 36
const HEIGHT = 11
const NARROW_WIDTH = 18
const headingStyle = new Style({bold: true, foreground: '#ffaa00'})
const centeredStyle = new Style({italic: true, foreground: '#88aaff'})
const rightStyle = new Style({
  underline: true,
  foreground: '#00ff88',
  background: '#202040',
})
const wrappedStyle = new Style({foreground: '#00ff88'})

const example = Stack.down({
  width: WIDTH,
  height: HEIGHT,
  children: [
    new Text({text: 'Text: style, wrap, alignment', style: headingStyle}),
    new Text({text: 'Left aligned', width: WIDTH, alignment: 'left'}),
    new Text({
      text: 'Centered',
      width: WIDTH,
      alignment: 'center',
      style: centeredStyle,
    }),
    new Text({
      text: 'Right aligned',
      width: WIDTH,
      alignment: 'right',
      style: rightStyle,
    }),
    new Text({
      text: 'Wrap: words stay together with room to spare',
      width: NARROW_WIDTH,
      height: 3,
      wrap: true,
      style: wrappedStyle,
    }),
    new Text({
      text: 'No wrap: this line is clipped here.',
      width: NARROW_WIDTH,
      wrap: false,
    }),
    new Text({lines: ['First source line', 'Second source line']}),
    new Text({text: 'TeaUI 123', font: 'monospace'}),
  ],
})

await Screen.start(example)
