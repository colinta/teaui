import React, {useState} from 'react'
import {Dropdown, Space, Stack, Text, run} from '@teaui/react'

const choices: [string, string][] = [
  ['Apple', 'apple'],
  ['Banana', 'banana'],
  ['Cherry', 'cherry'],
]

function App() {
  const [single, setSingle] = useState<string | undefined>(undefined)
  const [multiple, setMultiple] = useState(['apple', 'cherry'])

  return (
    <Stack.down width={30} height={12}>
      <Text>Single selection</Text>
      <Dropdown<string>
        choices={choices}
        title="Pick a fruit"
        multiple={false}
        selected={single}
        height={1}
        onSelect={setSingle}
      />
      <Text>Multiple selection</Text>
      <Dropdown<string>
        choices={choices}
        title="Pick several fruits"
        multiple
        selected={multiple}
        height={1}
        onSelect={setMultiple}
      />
      <Space flex={1} />
    </Stack.down>
  )
}

await run(<App />)
