import React from 'react'
import {At, Box, Space, Style, Text, ZStack} from '@teaui/react'

export function AtTab() {
  return (
    <ZStack flex={1}>
      <Space background="#333" />
      <At.topLeft>
        <Text>
          <Style bold> ⌜ top-left </Style>
        </Text>
      </At.topLeft>
      <At.topCenter>
        <Text>
          <Style bold> top-center </Style>
        </Text>
      </At.topCenter>
      <At.topRight>
        <Text>
          <Style bold> top-right ⌝</Style>
        </Text>
      </At.topRight>
      <At.left>
        <Text>
          <Style bold> ◁ left </Style>
        </Text>
      </At.left>
      <At.center>
        <Box border="rounded" padding={1}>
          <Text>center</Text>
        </Box>
      </At.center>
      <At.right>
        <Text>
          <Style bold> right ▷</Style>
        </Text>
      </At.right>
      <At.bottomLeft>
        <Text>
          <Style bold> ⌞ bottom-left </Style>
        </Text>
      </At.bottomLeft>
      <At.bottomCenter>
        <Text>
          <Style bold> bottom-center </Style>
        </Text>
      </At.bottomCenter>
      <At.bottomRight>
        <Text>
          <Style bold> bottom-right ⌟</Style>
        </Text>
      </At.bottomRight>
    </ZStack>
  )
}
