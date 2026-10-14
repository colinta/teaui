import React, {useState} from 'react'
import {Button, run} from '@teaui/react'

function App() {
  const [clicks, setClicks] = useState(0)

  return (
    <Button
      title={`Clicks: ${clicks}`}
      purpose="primary"
      hotKey="c"
      width={24}
      height={3}
      onClick={() => setClicks(count => count + 1)}
    />
  )
}

await run(<App />)
