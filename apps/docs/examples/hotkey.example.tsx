import React, {useState} from 'react'
import {AutoLegend, HotKey, Text, Stack} from '@teaui/react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Stack.down>
      <HotKey
        hotKey="C-n"
        label="Increment"
        onPress={() => setCount(c => c + 1)}
      />
      <Text>Press Ctrl+N to increment</Text>
      <Text>Count: {count}</Text>
      <AutoLegend width="fill" height={1} />
    </Stack.down>
  )
}

export default {width: 30, height: 4, title: 'HotKey', App}
