import React from 'react'
import {Badge, Stack} from '@teaui/react'

function App() {
  return (
    <Stack.down gap={1}>
      <Stack.right gap={1}>
        <Badge text="default" />
        <Badge text="primary" purpose="primary" />
        <Badge text="secondary" purpose="secondary" />
      </Stack.right>
      <Stack.right gap={1}>
        <Badge text="proceed" purpose="proceed" />
        <Badge text="cancel" purpose="cancel" />
        <Badge text="selected" purpose="selected" />
      </Stack.right>
    </Stack.down>
  )
}

export default {width: 40, height: 3, title: 'Badge', App}
