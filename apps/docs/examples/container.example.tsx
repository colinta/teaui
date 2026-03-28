import React from 'react'
import {Box, Stack, Text} from '@teaui/react'

function App() {
  return (
    <Stack.down gap={1}>
      <Box border="single" title="Panel">
        <Text>First child</Text>
        <Text>Second child</Text>
        <Text>Third child</Text>
      </Box>
    </Stack.down>
  )
}

export default {width: 30, height: 7, title: 'Container', App}
