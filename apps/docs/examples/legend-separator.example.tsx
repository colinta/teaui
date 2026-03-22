import React from 'react'
import {Legend} from '@teaui/react'

function App() {
  return (
    <Legend
      items={[
        {key: 's', label: 'stop'},
        {key: 'r', label: 'reset'},
        {key: 'q', label: 'quit'},
      ]}
      separator=" • "
    />
  )
}

export default {width: 35, height: 1, title: 'Legend — Separator', App}
