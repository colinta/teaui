import React, {useState} from 'react'
import {run, Slider, Stack, Text} from '@teaui/react'

const INITIAL_VALUE = 20

function describeValue(value: number) {
  return `Buttons: range [10, 30], value ${value}`
}

function App() {
  const [value, setValue] = useState(INITIAL_VALUE)
  const vertical = {range: [0, 100] as [number, number], value: 50, step: 25}

  return (
    <Stack.down width={44} height={27}>
      <Text>Default: range [0, 1], value 0</Text>
      <Slider width={44} height={1} />
      <Text>Bordered: range [0, 100], value 50</Text>
      <Slider range={[0, 100]} value={50} border width={44} height={3} />
      <Text>{describeValue(value)}</Text>
      <Slider
        range={[10, 30]}
        value={value}
        step={5}
        buttons
        width={44}
        height={1}
        onChange={setValue}
      />
      <Text>Border + buttons: value 75, step 5</Text>
      <Slider.horizontal
        range={[0, 100]}
        value={75}
        step={5}
        buttons
        border
        purpose="primary"
        width={44}
        height={3}
      />
      <Stack.right gap={2}>
        <Text width={21}>Minimum 0</Text>
        <Text width={21}>Maximum 100</Text>
      </Stack.right>
      <Stack.right gap={2}>
        <Slider range={[0, 100]} value={0} width={21} height={1} />
        <Slider range={[0, 100]} value={100} width={21} height={1} />
      </Stack.right>
      <Text>Vertical: [0, 100], step 25; down = more</Text>
      <Stack.right height={12} gap={1}>
        <Stack.down width={10}>
          <Text>Plain</Text>
          <Slider direction="vertical" {...vertical} width={1} height={11} />
        </Stack.down>
        <Stack.down width={10}>
          <Text>Border</Text>
          <Slider.vertical {...vertical} border width={3} height={11} />
        </Stack.down>
        <Stack.down width={10}>
          <Text>Buttons</Text>
          <Slider.vertical {...vertical} buttons width={1} height={11} />
        </Stack.down>
        <Stack.down width={11}>
          <Text>Both</Text>
          <Slider.vertical {...vertical} buttons border width={3} height={11} />
        </Stack.down>
      </Stack.right>
    </Stack.down>
  )
}

await run(<App />)
