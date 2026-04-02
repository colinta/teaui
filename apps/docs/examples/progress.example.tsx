import React from 'react'
import {Progress, Stack, Text} from '@teaui/react'

function App() {
  return (
    <Stack.down gap={1}>
      <Text>Downloading...</Text>
      <Progress value={65} max={100} showPercent />
      <Progress value={10} max={100} height={2} showPercent location="left" />
      <Progress value={30} max={100} height={3} showPercent location="right" />
    </Stack.down>
  )
}

export default {width: 35, height: 10, title: 'Progress', App}
