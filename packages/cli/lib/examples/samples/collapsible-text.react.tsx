import React from 'react'
import {CollapsibleText, run} from '@teaui/react'

await run(
  <CollapsibleText
    text={
      'Deployment summary\n3 checks passed\nNo warnings found\nReady to release'
    }
    preview={2}
    purpose="primary"
    width={32}
    height={4}
  />,
)
