import React, {useState} from 'react'
import {Geometry, Text, run} from '@teaui/react'

const items = ['Tea', 'Coffee', 'Cocoa', 'Water', 'Juice', 'Milk']

function App() {
  const [size, setSize] = useState({width: 0, height: 0})
  // Reserve the first content row for the measurement.
  const visible = items.slice(0, Math.max(0, size.height - 1))
  const text = [
    `Content: ${size.width}×${size.height}`,
    ...visible.map((item, index) => `${index + 1}. ${item}`),
  ].join('\n')

  return (
    <Geometry padding={1} onLayout={setSize}>
      <Text>{text}</Text>
    </Geometry>
  )
}

await run(<App />)
