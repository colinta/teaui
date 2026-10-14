import {HotKey, Screen, Stack, Text} from '@teaui/core'

let count = 0
const summary = new Text('Count: 0 | Last key: none')

const view = Stack.down({
  width: 48,
  height: 3,
  children: [
    // Zero-size views still register their keyboard shortcuts.
    new HotKey({
      hotKey: 'x',
      label: 'Count',
      onPress: event => {
        summary.text = `Count: ${++count} | Last key: ${event.full}`
      },
    }),
    new HotKey({
      hotKey: {char: 'r', ctrl: true},
      label: 'Reset',
      onPress: event => {
        count = 0
        summary.text = `Count: ${count} | Last key: ${event.full}`
      },
    }),
    new Text('HotKey registers without drawing'),
    new Text('Press x to count; Ctrl+R to reset'),
    summary,
  ],
})

await Screen.start(view)
