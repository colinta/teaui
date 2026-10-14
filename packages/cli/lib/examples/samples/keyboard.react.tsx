import React, {useState} from 'react'
import {Keyboard, Stack, Text, run} from '@teaui/react'

function App() {
  const [lastKey, setLastKey] = useState('none')

  return (
    <Keyboard width={32} height={3} onKey={event => setLastKey(event.full)}>
      {/* No focusable children: otherwise the focused view receives the key. */}
      <Stack.down>
        <Text>Press an unhandled key</Text>
        <Text>Last key: {lastKey}</Text>
        <Text>Ctrl+C quits</Text>
      </Stack.down>
    </Keyboard>
  )
}

await run(<App />)
