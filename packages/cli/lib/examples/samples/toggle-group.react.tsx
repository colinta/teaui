import React, {useState} from 'react'
import {run, Stack, Text, ToggleGroup} from '@teaui/react'

const SINGLE_TITLES = ['Left', 'Center', 'Right']
const MULTIPLE_TITLES = ['Bold', 'Italic', 'Underline']
const INITIAL_SINGLE = [1]
const INITIAL_MULTIPLE = [0, 2]

function describeSelection(titles: string[], selected: number[]) {
  return selected.map(index => titles[index]).join(', ') || 'none'
}

function App() {
  const [single, setSingle] = useState(INITIAL_SINGLE)
  const [multiple, setMultiple] = useState(INITIAL_MULTIPLE)

  return (
    <Stack.down width={36} height={11}>
      <Text>Single selection (click to toggle)</Text>
      <ToggleGroup
        titles={SINGLE_TITLES}
        selected={single}
        multiple={false}
        onChange={(_changed, selected) => setSingle(selected)}
      />
      <Text>Single: {describeSelection(SINGLE_TITLES, single)}</Text>
      <Text>Multiple selection</Text>
      <ToggleGroup
        titles={MULTIPLE_TITLES}
        selected={multiple}
        multiple={true}
        onChange={(_changed, selected) => setMultiple(selected)}
      />
      <Text>Multiple: {describeSelection(MULTIPLE_TITLES, multiple)}</Text>
      <Text>Click again to clear an option</Text>
    </Stack.down>
  )
}

await run(<App />)
