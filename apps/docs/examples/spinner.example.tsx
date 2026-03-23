import React from 'react'
import {Spinner, Text, Stack} from '@teaui/react'

function App() {
  return (
    <Stack.right gap={1}>
      <Spinner isAnimating />
      <Text>Loading...</Text>
    </Stack.right>
  )
}

export default {width: 20, height: 1, title: 'Spinner', App}
