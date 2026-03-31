import {AutoLegend, Box, Stack, Input, Space, Scrollable} from '@teaui/core'
import {codeHighlighter} from '@teaui/code'

import {demo} from './demo.js'

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

const codeInput = new Input({
  value: `\
[package]
name = "my-app"
version = "0.1.0"
edition = "2024"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1", features = ["full"] }

[dev-dependencies]
pretty_assertions = "1.4"
`,
  multiline: true,
  format: codeHighlighter('toml'),
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
  Stack.down([
    [
      'flex1',
      Scrollable.down({
        children: [
          //
          box(singleLine),
          box(emptySingleLine),
          box(wrapLine),
          box(codeInput),
          box(restrictedLine),
          box(restrictedMultiLine),
        ],
      }),
    ],
    new AutoLegend(),
  ]),
  false,
)
