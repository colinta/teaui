import React from 'react'
import {Stack, Text} from '@teaui/react'

export default function App() {
  return (
    <Stack.down>
      <Text>Left aligned</Text>
      <Text alignment="center">Centered</Text>
      <Text alignment="right">Right aligned</Text>
    </Stack.down>
  )
}
