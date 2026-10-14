import React from 'react'
import {run} from '@teaui/react'
import {Code} from '@teaui/code/react'

const SOURCE = [
  "const message = 'Syntax-highlighted code can wrap too.'",
  'function greet(name) {',
  '  return `Hello, ${name}!`',
  '}',
  "greet('TeaUI')",
].join('\n')

await run(
  <Code
    code={SOURCE}
    language="javascript"
    showLineNumbers
    highlightLines={[2]}
    wrap
    width={40}
    height={7}
  />,
)
