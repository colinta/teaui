import React from 'react'
import {AutoLegend, Input, Stack} from '@teaui/react'

function App() {
  return (
    <Stack.down gap={1}>
      <Input value="Search docs" placeholder="Type to filter" />
      <AutoLegend />
    </Stack.down>
  )
}

export default {width: 48, height: 4, title: 'AutoLegend', App}
