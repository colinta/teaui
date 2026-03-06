import {Box, Stack, Text, Button} from '@teaui/core'
import type {ScreenshotSpec} from './types.js'

// Matches the hero React example on the landing page:
//   <Box border="single">
//     <Stack.down>
//       First there was Ncurses
//       <Button onClick={goto10}>Tell me more!</Button>
//     </Stack.down>
//   </Box>

export default {
  size: {width: 40, height: 5},
  title: 'Stack',
  component: () =>
    new Box({
      border: 'single',
      children: [
        new Stack({
          direction: 'down',
          children: [
            new Text({text: 'First there was Ncurses'}),
            new Button({title: 'Tell me more!'}),
          ],
        }),
      ],
    }),
} satisfies ScreenshotSpec
