import React, {useState} from 'react'
import {Radio, RadioGroup, Stack} from '@teaui/react'

function App() {
  const [size, setSize] = useState('medium')

  return (
    <RadioGroup value={size} onChange={setSize}>
      <Stack.down>
        <Radio value="small" title="Small" />
        <Radio value="medium" title="Medium" />
        <Radio value="large" title="Large" />
      </Stack.down>
    </RadioGroup>
  )
}

export default {width: 30, height: 3, title: 'Radio', App}
