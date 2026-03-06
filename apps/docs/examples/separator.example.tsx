import React from 'react'
import {Stack, Text, Separator} from '@teaui/react'

export default function App() {
  return (
    <Stack.down>
      <Text>Above</Text>
      <Separator direction="horizontal" />
      <Text>Below</Text>
    </Stack.down>
  )
}
