import React from 'react'
import {Spinner, Text, Stack} from '@teaui/react'

function App() {
  return (
    <Stack.down gap={1}>
      <Stack.right gap={1}>
        <Spinner style="dots" />
        <Text>Dots</Text>
      </Stack.right>
      <Stack.right gap={1}>
        <Spinner style="bounce" />
        <Text>Bounce</Text>
      </Stack.right>
      <Stack.right gap={1}>
        <Spinner style="loop" />
        <Text>Loop</Text>
      </Stack.right>
      <Stack.right gap={1}>
        <Spinner style="kitt" />
        <Text>KITT</Text>
      </Stack.right>
    </Stack.down>
  )
}

export default {width: 20, height: 8, title: 'Spinner', App}
