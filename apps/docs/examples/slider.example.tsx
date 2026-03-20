import React from 'react'
import {Slider} from '@teaui/react'

function App() {
  return <Slider direction="horizontal" range={[0, 100]} value={65} />
}

export default {width: 30, height: 1, title: 'Slider', App}
