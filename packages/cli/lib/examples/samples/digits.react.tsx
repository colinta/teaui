import React from 'react'
import {Style} from '@teaui/core'
import {Digits, Stack, run} from '@teaui/react'

await run(
  <Stack direction="down" gap={1}>
    <Digits text={'tea\n3.14'} />
    <Digits text={2026} bold style={new Style({foreground: 'cyan'})} />
  </Stack>,
)
