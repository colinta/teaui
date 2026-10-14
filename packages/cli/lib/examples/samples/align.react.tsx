import React from 'react'
import {Align, Text, run} from '@teaui/react'

await run(
  <Align width={21} height={4}>
    <Text>TeaUI project details</Text>
    <Align.Row>
      <Text>Name</Text>
      <Text>TeaUI</Text>
    </Align.Row>
    <Align.Row>
      <Text>Language</Text>
      <Text>TypeScript</Text>
    </Align.Row>
    <Align.Row>
      <Text>Status</Text>
      <Text>Ready</Text>
    </Align.Row>
  </Align>,
)
