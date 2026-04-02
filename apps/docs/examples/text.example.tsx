import React from 'react'
import {Stack, Text, Style} from '@teaui/react'

function App() {
  return (
    <Stack.down>
      <Text italic>Left aligned</Text>
      <Text alignment="center" bold>
        Centered
      </Text>
      <Text alignment="right">
        <Style underline>Right</Style> aligned
      </Text>
    </Stack.down>
  )
}

export default {width: 30, height: 3, title: 'Text', App}
