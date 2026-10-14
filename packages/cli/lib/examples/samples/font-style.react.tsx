import React, {useState} from 'react'
import {FontStyle, Stack, Text, run, type FontStyleValue} from '@teaui/react'

const INITIAL_VALUE: FontStyleValue = {
  bold: true,
  italic: false,
  underline: true,
  strikethrough: false,
}

function describeStyles(value: FontStyleValue) {
  const enabled = (Object.keys(value) as (keyof FontStyleValue)[]).filter(
    key => value[key],
  )
  return `Enabled: ${enabled.join(', ') || 'none'}`
}

function App() {
  const [value, setValue] = useState(INITIAL_VALUE)

  return (
    <Stack.down width={48} height={5} gap={1}>
      <FontStyle value={value} onChange={setValue} />
      <Text>{describeStyles(value)}</Text>
    </Stack.down>
  )
}

await run(<App />)
