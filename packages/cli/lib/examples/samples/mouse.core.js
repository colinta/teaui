import {Mouse, Screen, Stack, Text} from '@teaui/core'

const lastEvent = new Text({text: 'Last event: none'})
const position = new Text({text: 'Position: none'})
const mouse = new Mouse({
  width: 40,
  height: 3,
  // Only left-button and wheel events, not pointer movement.
  mouse: ['mouse.button.left', 'mouse.wheel'],
  onMouse(event) {
    lastEvent.text = `Last event: ${event.name}`
    position.text = `Position: ${event.position.x}, ${event.position.y}`
  },
  child: Stack.down([lastEvent, position, new Text({text: 'Ctrl+C quits'})]),
})

// The heading is outside Mouse; coordinates start at the next row.
const view = Stack.down({
  width: 40,
  height: 4,
  children: [new Text({text: 'Click or scroll this region'}), mouse],
})

await Screen.start(view)
