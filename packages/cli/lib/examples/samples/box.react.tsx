import React from 'react'
import {Box, Text, run} from '@teaui/react'

await run(
  <Box
    border="rounded"
    title="Greeting"
    highlight
    location="center"
    width={24}
    height={5}
  >
    <Text>Hello from a box!</Text>
  </Box>,
)
