import React, {useState} from 'react'
import {Radio, RadioGroup, Stack, Text, run} from '@teaui/react'

function App() {
  const [value, setValue] = useState('comfortable')

  return (
    <Stack.down width={28} height={5}>
      <Text>Choose a density</Text>
      {/* Selection and onChange belong to RadioGroup, not individual Radios.
          hotKey adds a label/legend hint, not an unfocused keyboard shortcut. */}
      <RadioGroup value={value} onChange={setValue} purpose="primary">
        <Stack.down>
          <Radio
            title="Compact"
            value="compact"
            hotKey={{char: 'c', alt: true}}
            height={1}
          />
          <Radio
            title="Comfortable"
            value="comfortable"
            hotKey={{char: 'o', alt: true}}
            height={1}
          />
          <Radio
            title="Spacious"
            value="spacious"
            hotKey={{char: 's', alt: true}}
            height={1}
          />
        </Stack.down>
      </RadioGroup>
      <Text>{`Selected: ${value}`}</Text>
    </Stack.down>
  )
}

await run(<App />)
