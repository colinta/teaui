import {Radio, RadioGroup, Screen, Stack, Text} from '@teaui/core'

const selected = new Text({text: 'Selected: comfortable'})

// RadioGroup owns selection; its onChange receives the option value.
// hotKey adds a label/legend hint, not an unfocused keyboard shortcut.
const group = new RadioGroup({
  value: 'comfortable',
  purpose: 'primary',
  onChange: value => {
    selected.text = `Selected: ${value}`
  },
  child: Stack.down([
    new Radio({
      title: 'Compact',
      value: 'compact',
      hotKey: {char: 'c', alt: true},
      height: 1,
    }),
    new Radio({
      title: 'Comfortable',
      value: 'comfortable',
      hotKey: {char: 'o', alt: true},
      height: 1,
    }),
    new Radio({
      title: 'Spacious',
      value: 'spacious',
      hotKey: {char: 's', alt: true},
      height: 1,
    }),
  ]),
})

const examples = Stack.down({
  width: 28,
  height: 5,
  children: [new Text({text: 'Choose a density'}), group, selected],
})

await Screen.start(examples)
