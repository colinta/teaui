import React, {useState} from 'react'
import {run, Stack, Text, Toggle} from '@teaui/react'

const INITIAL_VALUE = false

function describeValue(value: boolean) {
  return `Notifications: ${value ? 'on' : 'off'}`
}

function App() {
  const [value, setValue] = useState(INITIAL_VALUE)

  return (
    <Stack.down width={32} height={9}>
      <Text>Normal: off / on</Text>
      <Stack.right gap={2} height={2}>
        <Toggle value={false} width={6} height={2} />
        <Toggle value={true} width={6} height={2} />
      </Stack.right>
      <Text>Compact: off / on</Text>
      <Stack.right gap={2} height={1}>
        <Toggle value={false} width={6} height={1} />
        <Toggle value={true} width={6} height={1} />
      </Stack.right>
      <Text>{describeValue(value)}</Text>
      <Toggle value={value} onChange={setValue} width={6} height={2} />
      <Text>Click, or Tab then Space/Enter</Text>
    </Stack.down>
  )
}

await run(<App />)
