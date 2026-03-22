import {
  Box,
  Stack,
  Input,
  Space,
  interceptConsoleLog,
  Scrollable,
} from '@teaui/core'

import {demo} from './demo.js'

interceptConsoleLog()

const singleLine = new Input({
  value: "family: 👨‍👩‍👧‍👦 smiley: 😀 some other text that isn't very interesting.",
})

const emptySingleLine = new Input({
  value: '',
  placeholder: 'Single line',
})

const wrapLine = new Input({
  value:
    'Once upon a time... There was a little kid. She got into all kinds of trouble. The End.',
  wrap: true,
  width: 20,
  height: 3,
})

const emptyMultiLine = new Input({
  value: 'asdf\nasdf\nasdf\n',
  placeholder: 'INSERT\nLINES\nHERE',
  wrap: true,
  multiline: true,
})

const restrictedLine = new Input({
  value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  maxWidth: 20,
})

const restrictedMultiLine = new Input({
  value: `\
Lorem ipsum
dolor sit
amet, ac
sodales dui
eros ac
elit...`,
  placeholder: 'ahha',
  maxWidth: 10,
  maxHeight: 5,
  multiline: true,
})

function box(input: Input) {
  return Stack.right({
    children: [new Box({border: 'single', child: input}), new Space()],
  })
}

demo(
  new Scrollable({
    child: Stack.down({
      children: [
        //
        box(singleLine),
        box(emptySingleLine),
        box(wrapLine),
        box(emptyMultiLine),
        box(restrictedLine),
        box(restrictedMultiLine),
      ],
    }),
  }),
  false,
)
