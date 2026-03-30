import React from 'react'
import {Box, Stack, Text} from '@teaui/react'

function App() {
  return (
    <Stack.down>
      <Box border="single" title="Panel">
        <Text>First child</Text>
      </Box>
    </Stack.down>
  )
}

export default {width: 30, height: 7, title: 'Container', App}
