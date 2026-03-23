import React, {useState} from 'react'
import {HotKey, Text, Stack} from '@teaui/react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Stack.down>
      <HotKey
        hotKey={{char: 'n', ctrl: true}}
        onPress={() => setCount(c => c + 1)}
      >
        <Text>Press Ctrl+N to increment</Text>
      </HotKey>
      <Text>Count: {count}</Text>
    </Stack.down>
  )
}

export default {width: 30, height: 3, title: 'HotKey', App}
