import React from 'react'
import {Stack, Text} from '@teaui/react'

function App() {
  return (
    <Stack.down>
      <Text>Left aligned</Text>
      <Text alignment="center">Centered</Text>
      <Text alignment="right">Right aligned</Text>
    </Stack.down>
  )
}

export default {width: 30, height: 3, title: 'Text', App}
