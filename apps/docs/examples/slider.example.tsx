import React from 'react'
import {Slider} from '@teaui/react'

export default function App() {
  return <Slider direction="horizontal" range={[0, 100]} value={65} />
}
