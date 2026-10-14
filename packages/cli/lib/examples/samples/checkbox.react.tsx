import React, {useState} from 'react'
import {Checkbox, run} from '@teaui/react'

function App() {
  const [value, setValue] = useState(false)

  return (
    <Checkbox
      title={`Notifications: ${value ? 'on' : 'off'}`}
      value={value}
      purpose="primary"
      width={24}
      height={1}
      onChange={setValue}
    />
  )
}

await run(<App />)
