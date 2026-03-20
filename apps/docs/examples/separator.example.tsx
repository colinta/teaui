import React from 'react'
import {Stack, Text, Separator} from '@teaui/react'

function App() {
  return (
    <Stack.down>
      <Text>Above</Text>
      <Separator direction="horizontal" />
      <Text>Below</Text>
    </Stack.down>
  )
}

export default {width: 30, height: 3, title: 'Separator', App}
