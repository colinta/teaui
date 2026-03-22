import React from 'react'
import {Legend} from '@teaui/react'

function App() {
  return (
    <Legend
      items={[
        {key: ['up', 'down'], label: 'navigate'},
        {key: 'enter', label: 'select'},
        {key: 'q', label: 'quit'},
        {key: '?', label: 'help'},
        {key: 'escape', label: 'cancel'},
      ]}
    />
  )
}

export default {width: 55, height: 1, title: 'Legend', App}
