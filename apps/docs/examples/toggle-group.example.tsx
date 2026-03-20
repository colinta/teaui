import React from 'react'
import {ToggleGroup} from '@teaui/react'

function App() {
  return <ToggleGroup titles={['Small', 'Medium', 'Large']} selected={[1]} />
}

export default {width: 30, height: 1, title: 'ToggleGroup', App}
