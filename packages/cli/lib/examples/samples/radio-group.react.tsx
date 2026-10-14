import React, {useState} from 'react'
import {Radio, RadioGroup, Stack, Text, run} from '@teaui/react'

const OPTIONS = [
  ['Economy', 'economy'],
  ['Standard', 'standard'],
  ['Express', 'express'],
]
const INITIAL_VALUE = 'standard'

function describeSelection(value: string) {
  const label = OPTIONS.find(([, option]) => option === value)?.[0] ?? 'none'
  return `Shipping: ${label}`
}

function App() {
  const [value, setValue] = useState(INITIAL_VALUE)

  return (
    <RadioGroup width={32} height={5} value={value} onChange={setValue}>
      <Stack.down gap={1}>
        <Stack.down>
          {OPTIONS.map(([title, value]) => (
            <Radio key={value} title={title} value={value} />
          ))}
        </Stack.down>
        <Text>{describeSelection(value)}</Text>
      </Stack.down>
    </RadioGroup>
  )
}

await run(<App />)
