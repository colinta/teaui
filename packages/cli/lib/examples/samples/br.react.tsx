import React from 'react'
import {Br, Text, run} from '@teaui/react'

await run(
  <Text>
    First line
    <Br />
    Second line
    <Br />
    <Br />
    After blank line
  </Text>,
)
