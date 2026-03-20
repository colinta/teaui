import React from 'react'
import {Stack, Text, Space} from '@teaui/react'

function App() {
  return (
    <Stack.right>
      <Text>Left</Text>
      <Space flex={1} />
      <Text>Right</Text>
    </Stack.right>
  )
}

export default {width: 30, height: 1, title: 'Space', App}
