import React from 'react'
import {Text, TrackMouse, run} from '@teaui/react'

await run(
  <TrackMouse width={24} height={5}>
    <Text>{'Move over this panel\nRulers show position.'}</Text>
  </TrackMouse>,
)
