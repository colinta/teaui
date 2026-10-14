import {Pressable, Screen, Stack, Text} from '@teaui/core'

let keyboardClicks = 0
let mouseClicks = 0
const keyboardCount = new Text({text: 'Activations: 0'})
const mouseCount = new Text({text: 'Activations: 0'})

// Pressable adds feedback and activation, not a title or border.
const keyboardCard = new Pressable({
  width: 40,
  height: 2,
  purpose: 'primary',
  foreground: 'white',
  focusable: true,
  onClick() {
    keyboardCount.text = `Activations: ${++keyboardClicks}`
  },
  child: Stack.down([new Text({text: 'Keyboard + mouse'}), keyboardCount]),
})
const mouseCard = new Pressable({
  width: 40,
  height: 2,
  purpose: 'proceed',
  focusable: false,
  onClick() {
    mouseCount.text = `Activations: ${++mouseClicks}`
  },
  child: Stack.down([
    new Text({text: 'Mouse only (focusable: false)'}),
    mouseCount,
  ]),
})

const view = Stack.down({
  width: 40,
  height: 6,
  children: [
    new Text({text: 'Custom surfaces (no button decoration)'}),
    keyboardCard,
    mouseCard,
    new Text({text: 'Tab then Enter, or click; Ctrl+C quits'}),
  ],
})

await Screen.start(view)
