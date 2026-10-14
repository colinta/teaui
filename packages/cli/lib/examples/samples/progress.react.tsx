import React from 'react'
import {Progress, Stack, Text, run} from '@teaui/react'

function App() {
  return (
    <Stack.down width={36} height={19}>
      <Text>Default: empty, no percentage</Text>
      <Progress height={1} />
      <Text>Half: no percentage</Text>
      <Progress value={50} height={1} />
      <Text>Centered percentage</Text>
      <Progress
        value={65}
        showPercent
        location="center"
        purpose="primary"
        height={1}
      />
      <Text>Left: external percentage</Text>
      <Progress value={5} showPercent location="left" height={1} />
      <Text>Right: clamped above maximum</Text>
      <Progress value={150} showPercent location="right" height={1} />
      <Text>Custom range: 10..30, value 20</Text>
      <Progress min={10} max={30} value={20} showPercent height={3} />
      <Text>Vertical: fills bottom to top</Text>
      <Progress
        direction="vertical"
        value={50}
        purpose="proceed"
        width={3}
        height={4}
      />
    </Stack.down>
  )
}

await run(<App />)
