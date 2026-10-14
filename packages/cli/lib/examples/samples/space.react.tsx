import React from 'react'
import {Space, Stack, Text, run} from '@teaui/react'

function App() {
  return (
    <Stack.down width={40} height={14} background="default">
      <Text>Natural: no implicit gap</Text>
      <Stack.right height={1}>
        <Text>A</Text>
        <Space />
        <Text>B</Text>
      </Stack.right>
      <Text>Fixed width: 4 columns</Text>
      <Stack.right height={1}>
        <Text>Left</Text>
        <Space width={4} />
        <Text>Right</Text>
      </Stack.right>
      <Text>Flexible: consumes remaining width</Text>
      <Stack.right height={1}>
        <Text>Left</Text>
        <Space flex={1} />
        <Text>Right</Text>
      </Stack.right>
      <Text>Fixed height: 2 rows</Text>
      <Text>Top</Text>
      <Space height={2} />
      <Text>Bottom</Text>
      <Text>Background: cyan, 8 x 2</Text>
      <Stack.right height={2}>
        <Text>[</Text>
        <Space width={8} height={2} background="cyan" />
        <Text>]</Text>
      </Stack.right>
    </Stack.down>
  )
}

await run(<App />)
