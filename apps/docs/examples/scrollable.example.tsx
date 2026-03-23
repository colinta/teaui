import React from 'react'
import {Scrollable, Text} from '@teaui/react'

function App() {
  return (
    <Scrollable.down>
      {Array.from({length: 20}, (_, i) => (
        <Text key={i}>Line {i + 1}</Text>
      ))}
    </Scrollable.down>
  )
}

export default {width: 30, height: 8, title: 'Scrollable', App}
