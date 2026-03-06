import React from 'react'
import {Box, Button, Stack} from '@teaui/react'
import {renderReact} from './renderReact.js'
import type {ScreenshotSpec} from './types.js'

// Matches the hero React example on the landing page
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

export default {
  size: {width: 40, height: 5},
  title: 'Stack',
  component: () => renderReact(<App />),
} satisfies ScreenshotSpec
