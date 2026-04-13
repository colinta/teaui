import React from 'react'
import {At, Box, Space, Style, Text, ZStack} from '@teaui/react'

function App() {
  return (
    <ZStack flex={1}>
      <Space background="#333" />
      <At.topLeft>
        <Text>
          <Style bold>top-left</Style>
        </Text>
      </At.topLeft>
      <At.topRight>
        <Text>
          <Style bold>top-right</Style>
        </Text>
      </At.topRight>
      <At.center>
        <Box border="rounded" padding={1}>
          <Text>center</Text>
        </Box>
      </At.center>
      <At.bottomCenter>
        <Text>
          <Style bold>bottom-center</Style>
        </Text>
      </At.bottomCenter>
    </ZStack>
  )
}

export default {width: 30, height: 9, title: 'At', App}
