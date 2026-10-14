import {Legend, Screen, Stack, Text} from '@teaui/core'

const items = [
  {key: ['up', 'down'], label: 'Move'},
  {key: 'enter', label: 'Select'},
  {key: 'escape', label: 'Cancel'},
  {key: 'tab', label: 'Switch'},
  {key: 'C-c', label: 'Quit'},
]

// Legend displays hints only; Screen.start already binds Ctrl+C to quit.
const view = Stack.down({
  width: 48,
  height: 8,
  gap: 1,
  children: [
    Stack.down({
      children: [
        new Text({text: 'Keyboard hints (48 columns)'}),
        new Legend({items}),
      ],
    }),
    Stack.down({
      width: 24,
      children: [
        new Text({text: 'Wrapped (24 columns)'}),
        new Legend({items, purpose: 'primary'}),
      ],
    }),
  ],
})

await Screen.start(view)
