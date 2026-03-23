import React from 'react'
import {Progress, Stack, Text} from '@teaui/react'

function App() {
  return (
    <Stack.down gap={1}>
      <Text>Downloading...</Text>
      <Progress value={65} max={100} showPercent />
      <Progress value={30} max={100} showPercent location="right" />
    </Stack.down>
  )
}

export default {width: 35, height: 5, title: 'Progress', App}
