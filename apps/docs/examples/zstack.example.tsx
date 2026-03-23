import React from 'react'
import {ZStack, Box, Text, Space} from '@teaui/react'

function App() {
  return (
    <ZStack location="center">
      <Space background="#404040" />
      <Box border="rounded" padding={1}>
        <Text>Centered on top</Text>
      </Box>
    </ZStack>
  )
}

export default {width: 30, height: 7, title: 'ZStack', App}
