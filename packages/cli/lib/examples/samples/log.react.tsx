import React from 'react'
import {Log, run} from '@teaui/react'

await run(
  <Log
    logs={[
      {level: 'info', args: ['Server started']},
      {level: 'warn', args: ['Slow connection']},
      {level: 'error', args: ['Retry needed\nCheck the network']},
    ]}
  />,
)
