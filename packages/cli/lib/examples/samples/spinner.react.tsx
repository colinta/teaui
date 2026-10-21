import React from 'react'
import {run, Spinner, Stack, Text} from '@teaui/react'

function App() {
  return (
    <Stack.down width={44} height={16} background="default">
      <Text>Spinner styles (initial frame)</Text>
      <Text>dots: default style and animation (1x1)</Text>
      <Spinner purpose="primary" />
      <Text>bounce: isAnimating = true (5x2)</Text>
      <Spinner style="bounce" isAnimating={true} purpose="proceed" />
      <Text>loop (5x1)</Text>
      <Spinner style="loop" purpose="secondary" />
      <Text>kitt (7x1)</Text>
      <Spinner style="kitt" purpose="red" />
      <Text>snake (3x3)</Text>
      <Spinner style="snake" purpose="green" />
      <Text>Paused dots: still visible, same accent</Text>
      <Spinner isAnimating={false} purpose="primary" />
    </Stack.down>
  )
}

await run(<App />)
