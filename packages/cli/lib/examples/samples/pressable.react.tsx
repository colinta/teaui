import React, {useState} from 'react'
import {Pressable, Stack, Text, run} from '@teaui/react'

function App() {
  const [keyboardClicks, setKeyboardClicks] = useState(0)
  const [mouseClicks, setMouseClicks] = useState(0)

  // Pressable adds feedback and activation, not a title or border.
  return (
    <Stack.down width={40} height={6}>
      <Text>Custom surfaces (no button decoration)</Text>
      <Pressable
        width={40}
        height={2}
        purpose="primary"
        foreground="white"
        focusable={true}
        onClick={() => setKeyboardClicks(count => count + 1)}
      >
        <Stack.down>{`Keyboard + mouse\nActivations: ${keyboardClicks}`}</Stack.down>
      </Pressable>
      <Pressable
        width={40}
        height={2}
        purpose="proceed"
        focusable={false}
        onClick={() => setMouseClicks(count => count + 1)}
      >
        <Stack.down>{`Mouse only (focusable: false)\nActivations: ${mouseClicks}`}</Stack.down>
      </Pressable>
      <Text>Tab then Enter, or click; Ctrl+C quits</Text>
    </Stack.down>
  )
}

await run(<App />)
