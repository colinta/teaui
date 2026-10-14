import React, {useState} from 'react'
import {HotKey, Stack, Text, run} from '@teaui/react'

function App() {
  const [state, setState] = useState({count: 0, lastKey: 'none'})

  return (
    <Stack.down width={48} height={3}>
      {/* Zero-size views still register their keyboard shortcuts. */}
      <HotKey
        hotKey="x"
        label="Count"
        onPress={event => {
          setState(previous => ({
            count: previous.count + 1,
            lastKey: event.full,
          }))
        }}
      />
      <HotKey
        hotKey={{char: 'r', ctrl: true}}
        label="Reset"
        onPress={event => setState({count: 0, lastKey: event.full})}
      />
      <Text>HotKey registers without drawing</Text>
      <Text>Press x to count; Ctrl+R to reset</Text>
      <Text>{`Count: ${state.count} | Last key: ${state.lastKey}`}</Text>
    </Stack.down>
  )
}

await run(<App />)
