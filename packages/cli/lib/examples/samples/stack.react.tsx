import React from 'react'
import {run, Stack, Text} from '@teaui/react'

function App() {
  return (
    <Stack.down width={44} height={13}>
      <Text>Directions: same children A, B, C</Text>
      <Stack.right gap={2}>
        <Text width={21}>down (gap 1)</Text>
        <Text width={21}>up (gap 1)</Text>
      </Stack.right>
      <Stack.right height={5} gap={2}>
        <Stack.down width={21} height={5} gap={1}>
          <Text>A</Text>
          <Text>B</Text>
          <Text>C</Text>
        </Stack.down>
        <Stack.up width={21} height={5} gap={1}>
          <Text>A</Text>
          <Text>B</Text>
          <Text>C</Text>
        </Stack.up>
      </Stack.right>
      <Text>right (gap 2)</Text>
      <Stack.right gap={2}>
        <Text>A</Text>
        <Text>B</Text>
        <Text>C</Text>
      </Stack.right>
      <Text>left (gap 2)</Text>
      <Stack.left gap={2}>
        <Text>A</Text>
        <Text>B</Text>
        <Text>C</Text>
      </Stack.left>
      <Stack.right gap={1}>
        <Text width={15}>fill=true</Text>
        <Stack direction="right" fill={true}>
          <Text flex={1}>A</Text>
          <Text flex={1}>B</Text>
        </Stack>
      </Stack.right>
      <Stack.right gap={1}>
        <Text width={15}>fill=false</Text>
        <Stack direction="right" fill={false}>
          <Text flex={1}>A</Text>
          <Text flex={1}>B</Text>
        </Stack>
      </Stack.right>
    </Stack.down>
  )
}

await run(<App />)
