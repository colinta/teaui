import React from 'react'
import {Desktop, run, Stack, Text, Window} from '@teaui/react'

function App() {
  return (
    <Stack.down width={44} height={17}>
      <Desktop height={9}>
        <Window title="Notes" x={0} y={0} width={24} height={6}>
          <Text>floating layout</Text>
        </Window>
        <Window title="Tools" x={18} y={3} width={26} height={6}>
          <Text>drag the title bar</Text>
        </Window>
        <Window title="Help" isMinimized />
      </Desktop>
      <Desktop layout="tiled" height={8}>
        <Window title="Main">
          <Text>tiled layout</Text>
        </Window>
        <Window title="Stacked">
          <Text>drag the border</Text>
        </Window>
        <Window title="Minimized" isMinimized />
      </Desktop>
    </Stack.down>
  )
}

await run(<App />)
