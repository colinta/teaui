import {Input, Screen} from '@teaui/core'

const INITIAL_TEXT = [
  'This inline Input uses its natural height.',
  'It starts with multiple editable lines.',
  'Resize the terminal to see wrapped text reflow.',
].join('\n')

process.stdout.write(
  [
    'TeaUI natural-height inline input',
    'Edit the multiline text below. Press Ctrl-C to exit.',
  ].join('\n') + '\n',
)

await Screen.start(
  new Input({
    value: INITIAL_TEXT,
    multiline: true,
    wrap: true,
  }),
  {
    quitChar: 'C-c',
    display: {
      mode: 'inline',
      height: 'natural',
      clearOnExit: false,
    },
  },
)
