import React from 'react'
import {AutoLegend, HotKey, Input, Stack, ZStack, run} from '@teaui/react'

await run(
  <Stack.down width={48} height={4} gap={1}>
    <ZStack>
      <Input value="Search docs" />
      {/* run already binds Ctrl+C to quit. */}
      <HotKey hotKey="C-c" label="Quit" />
    </ZStack>
    <AutoLegend />
  </Stack.down>,
)
