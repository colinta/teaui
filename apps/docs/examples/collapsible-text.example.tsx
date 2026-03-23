import React from 'react'
import {CollapsibleText, Stack} from '@teaui/react'

function App() {
  return (
    <Stack.down>
      <CollapsibleText text="This is a long piece of text that would normally take up multiple lines, but when collapsed it shows just one line with a truncation indicator. Click to expand and see the full content." />
    </Stack.down>
  )
}

export default {width: 40, height: 3, title: 'CollapsibleText', App}
