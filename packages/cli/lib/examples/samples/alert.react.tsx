import React from 'react'
import {Alert, Stack, Text, run} from '@teaui/react'

await run(
  <Stack.down>
    <Text>Document editor</Text>
    <Alert visible title="Unsaved changes" purpose="secondary">
      <Text>Save before closing this document.</Text>
    </Alert>
  </Stack.down>,
)
