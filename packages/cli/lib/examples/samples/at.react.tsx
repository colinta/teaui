import React from 'react'
import {At, Text, ZStack, run} from '@teaui/react'

await run(
  <ZStack width={28} height={5}>
    <At location="top-left">
      <Text>Start</Text>
    </At>
    <At.topRight>
      <Text>Ready</Text>
    </At.topRight>
    <At.center>
      <Text>TeaUI</Text>
    </At.center>
    <At.bottomLeft>
      <Text>Help</Text>
    </At.bottomLeft>
    <At.bottomRight>
      <Text>Exit</Text>
    </At.bottomRight>
  </ZStack>,
)
