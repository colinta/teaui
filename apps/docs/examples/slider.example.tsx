import React from 'react'
import {Slider, Stack} from '@teaui/react'

function App() {
  return (
    <Stack.down gap={1}>
      <Slider direction="horizontal" range={[0, 100]} value={65} />
      <Slider
        direction="horizontal"
        range={[0, 100]}
        value={10}
        border
        buttons
      />
    </Stack.down>
  )
}

export default {width: 30, height: 5, title: 'Slider', App}
