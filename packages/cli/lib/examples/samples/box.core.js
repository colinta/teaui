import {Box, Screen, Text} from '@teaui/core'

const box = new Box({
  border: 'rounded',
  title: 'Greeting',
  highlight: true,
  location: 'center',
  width: 24,
  height: 5,
  child: new Text('Hello from a box!'),
})

await Screen.start(box)
