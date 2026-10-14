import React from 'react'
import {Legend, Stack, Text, run} from '@teaui/react'

const items = [
  {key: ['up', 'down'], label: 'Move'},
  {key: 'enter', label: 'Select'},
  {key: 'escape', label: 'Cancel'},
  {key: 'tab', label: 'Switch'},
  {key: 'C-c', label: 'Quit'},
]

// Legend displays hints only; run already binds Ctrl+C to quit.
await run(
  <Stack.down width={48} height={8} gap={1}>
    <Stack.down>
      <Text>Keyboard hints (48 columns)</Text>
      <Legend items={items} />
    </Stack.down>
    <Stack.down width={24}>
      <Text>Wrapped (24 columns)</Text>
      <Legend items={items} purpose="primary" />
    </Stack.down>
  </Stack.down>,
)
