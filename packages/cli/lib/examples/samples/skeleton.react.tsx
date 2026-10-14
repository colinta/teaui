import React from 'react'
import {run, Skeleton, Stack, Text} from '@teaui/react'

function App() {
  return (
    <Stack.down width={44} height={13} background="default">
      <Text>Skeleton loading placeholders</Text>
      <Stack.right height={5} gap={1}>
        <Stack.down width={14}>
          <Text>rect (default)</Text>
          <Skeleton width={14} height={4} />
        </Stack.down>
        <Stack.down width={14}>
          <Text>rounded-rect</Text>
          <Skeleton shape="rounded-rect" width={14} height={4} />
        </Stack.down>
        <Stack.down width={14}>
          <Text>circle (8x4)</Text>
          <Skeleton shape="circle" width={8} height={4} />
        </Stack.down>
      </Stack.right>
      <Text>row: natural height = 1</Text>
      <Skeleton shape="row" height="natural" />
      <Text>column: natural width = 1</Text>
      <Skeleton shape="column" width="natural" height={4} />
    </Stack.down>
  )
}

await run(<App />)
