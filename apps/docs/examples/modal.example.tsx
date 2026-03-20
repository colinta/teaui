import React from 'react'
import {Box, Stack, Text} from '@teaui/react'

function App() {
  return (
    <Box border="rounded" padding={1} width={24} height={5}>
      <Stack.down>
        <Text alignment="center">⚠ Are you sure?</Text>
        <Text alignment="center">[ OK ] [ Cancel ]</Text>
      </Stack.down>
    </Box>
  )
}

export default {width: 30, height: 7, title: 'Modal', App}
