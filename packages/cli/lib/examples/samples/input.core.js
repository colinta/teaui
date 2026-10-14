import {Input, Screen, Stack, Text} from '@teaui/core'

const status = new Text({text: 'Ready'})
const name = new Input({
  value: 'TeaUI',
  height: 1,
  onChange: value => {
    status.text = `Editing: ${value}`
  },
  onSubmit: value => {
    status.text = `Submitted: ${value}`
  },
})

const examples = Stack.down({
  width: 36,
  height: 17,
  children: [
    new Text({text: 'Name (Enter submits)'}),
    name,
    status,
    new Text({text: 'Empty placeholder'}),
    new Input({value: '', placeholder: 'Type a note...', height: 1}),
    new Text({text: 'Wrapped single line'}),
    new Input({
      value: 'Wrapping keeps this one logical line.',
      wrap: true,
      width: 24,
      height: 2,
    }),
    new Text({text: 'Multiline (Enter adds a line)'}),
    new Input({
      value: 'first line\nsecond line',
      multiline: true,
      wrap: true,
      height: 3,
    }),
    new Text({text: 'Unicode font'}),
    new Input({value: 'TeaUI 123', font: 'double-struck', height: 1}),
    new Text({text: 'ANSI format (value unchanged)'}),
    new Input({
      value: 'Styled text',
      format: text => `\x1b[1;36m${text}\x1b[0m`,
      height: 1,
    }),
  ],
})

await Screen.start(examples)
