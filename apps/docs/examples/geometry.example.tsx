import React, {useState} from 'react'
import {Geometry, Stack, Text} from '@teaui/react'

function App() {
  const [size, setSize] = useState({width: 0, height: 0})

  return (
    <Geometry onLayout={setSize}>
      <Stack.down>
        <Text>{`Size: ${size.width}×${size.height}`}</Text>
        <Text>{`Rows for content: ${Math.max(0, size.height - 1)}`}</Text>
      </Stack.down>
    </Geometry>
  )
}

export default {width: 30, height: 2, title: 'Geometry', App}
