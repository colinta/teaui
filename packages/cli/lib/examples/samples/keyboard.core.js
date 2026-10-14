import {Keyboard, Screen, Stack, Text} from '@teaui/core'

const status = new Text({text: 'Last key: none'})
const keyboard = new Keyboard({
  width: 32,
  height: 3,
  // No focusable children: otherwise the focused view receives the key.
  onKey(event) {
    status.text = `Last key: ${event.full}`
  },
  child: Stack.down([
    new Text({text: 'Press an unhandled key'}),
    status,
    new Text({text: 'Ctrl+C quits'}),
  ]),
})

await Screen.start(keyboard)
