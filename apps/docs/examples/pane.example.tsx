import React from 'react'
import {Pane, Text, Stack} from '@teaui/react'

function App() {
  return (
    <Pane border>
      <Stack.down>
        <Text>Inbox</Text>
        <Text>Drafts</Text>
        <Text>Sent</Text>
      </Stack.down>
      <Text>Select an item to view details.</Text>
    </Pane>
  )
}

export default {width: 40, height: 8, title: 'Pane', App}
