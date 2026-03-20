import React from 'react'
import {Stack, Checkbox} from '@teaui/react'

function App() {
  return (
    <Stack.down>
      <Checkbox title="Enable notifications" isChecked />
      <Checkbox title="Dark mode" />
      <Checkbox title="Auto-save" isChecked />
    </Stack.down>
  )
}

export default {width: 40, height: 3, title: 'Checkbox', App}
