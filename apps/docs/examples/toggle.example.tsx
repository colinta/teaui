import React, {useState} from 'react'
import {Stack, Text, Toggle} from '@teaui/react'

function App() {
  const [airplaneMode, setAirplaneMode] = useState(false)
  const [wifi, setWifi] = useState(true)

  return (
    <Stack.down gap={1}>
      <Stack.right gap={1}>
        <Toggle value={airplaneMode} onChange={setAirplaneMode} />
        <Text>Airplane Mode</Text>
      </Stack.right>
      <Stack.right gap={1}>
        <Toggle height={1} value={wifi} onChange={setWifi} />
        <Text>Wi-Fi</Text>
      </Stack.right>
    </Stack.down>
  )
}

export default {width: 30, height: 5, title: 'Toggle', App}
