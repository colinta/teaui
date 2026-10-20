import React from 'react'
import {run, Stack, Text, Window} from '@teaui/react'

const WIDTH = 44
const HALF = 22

function App() {
  return (
    <Stack.down width={WIDTH} height={10}>
      <Stack.right>
        <Window title="Inactive" width={HALF} height={4}>
          <Text>rounded border</Text>
        </Window>
        <Window title="Active" width={HALF} height={4}>
          <Text>double border</Text>
        </Window>
      </Stack.right>
      <Window
        title="A title that is much too long"
        width={WIDTH}
        height={3}
        showClose={false}
        titleBar={<Text>[save]</Text>}
      >
        <Text>title bar views sit before the buttons</Text>
      </Window>
      <Window
        title="No buttons"
        width={WIDTH}
        height={2}
        showClose={false}
        showMinimize={false}
        showMaximize={false}
      />
      <Window title="Minimized to one row" width={WIDTH} isMinimized />
    </Stack.down>
  )
}

await run(<App />)
