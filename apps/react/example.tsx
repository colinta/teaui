import React, {useReducer} from 'react'
import {interceptConsoleLog} from '@teaui/core'
import {Box, Button, Stack, run} from '@teaui/react'

interceptConsoleLog()

function App() {
  const [bang, goto10] = useReducer(s => s + '!', '')
  return (
    <Box border="single">
      <Stack.down>
        First there was Ncurses{bang}
        <Button onClick={goto10}>Tell me more!</Button>
      </Stack.down>
    </Box>
  )
}

run(<App />)
