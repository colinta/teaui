import React, {useState} from 'react'
import {Logo, Stack, Text, Toggle} from '@teaui/react'

function App() {
  const [isAnimating, setIsAnimating] = useState(false)

  return (
    <Stack.down gap={1}>
      <Logo isAnimating={isAnimating} />
      <Stack.right gap={1}>
        <Text>Animate</Text>
        <Toggle height={1} value={isAnimating} onChange={setIsAnimating} />
      </Stack.right>
    </Stack.down>
  )
}

export default {width: 18, height: 9, title: 'Logo', App}
