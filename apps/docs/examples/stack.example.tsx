import React from 'react'
import {Box, Stack, Button} from '@teaui/react'

function App() {
  return (
    <Box border="single">
      <Stack.down>
        First there was Ncurses
        <Button onClick={() => {}}>Tell me more!</Button>
      </Stack.down>
    </Box>
  )
}

export default {width: 40, height: 5, title: 'Stack', App}
