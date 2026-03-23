import React, {useState} from 'react'
import {Dropdown, Stack, Text} from '@teaui/react'

function App() {
  const [color, setColor] = useState('red')

  return (
    <Stack.down gap={1}>
      <Dropdown
        title="Color"
        choices={[
          ['Red', 'red'],
          ['Green', 'green'],
          ['Blue', 'blue'],
          ['Yellow', 'yellow'],
        ]}
        selected={color}
        onSelect={setColor}
      />
      <Text>Selected: {color}</Text>
    </Stack.down>
  )
}

export default {width: 30, height: 4, title: 'Dropdown', App}
