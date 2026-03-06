import React from 'react'
import {ToggleGroup} from '@teaui/react'

export default function App() {
  return (
    <ToggleGroup
      titles={['Small', 'Medium', 'Large']}
      selected={[1]}
    />
  )
}
