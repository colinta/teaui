import React, {useState} from 'react'
import {Mouse, Stack, Text, run} from '@teaui/react'

function App() {
  const [lastEvent, setLastEvent] = useState('none')
  const [position, setPosition] = useState('none')

  // The heading is outside Mouse; coordinates start at the next row.
  return (
    <Stack.down width={40} height={4}>
      <Text>Click or scroll this region</Text>
      {/* Only left-button and wheel events, not pointer movement. */}
      <Mouse
        width={40}
        height={3}
        mouse={['mouse.button.left', 'mouse.wheel']}
        onMouse={event => {
          setLastEvent(event.name)
          setPosition(`${event.position.x}, ${event.position.y}`)
        }}
      >
        <Stack.down>
          <Text>Last event: {lastEvent}</Text>
          <Text>Position: {position}</Text>
          <Text>Ctrl+C quits</Text>
        </Stack.down>
      </Mouse>
    </Stack.down>
  )
}

await run(<App />)
