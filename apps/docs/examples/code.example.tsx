import React from 'react'
import {Scrollable} from '@teaui/react'
import {Code} from '@teaui/code/react'

const SAMPLE = `import React, {useState} from 'react'

function Counter() {
  const [count, setCount] = useState(0)
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  )
}`

function App() {
  return (
    <Scrollable flex={1}>
      <Code
        code={SAMPLE}
        language="javascript"
        showLineNumbers
        highlightLines={[4]}
      />
    </Scrollable>
  )
}

export default {width: 50, height: 16, title: 'Code', App}
