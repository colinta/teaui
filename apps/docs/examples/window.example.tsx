import React, {useState} from 'react'
import {Button, Stack, Text, Window} from '@teaui/react'

function App() {
  const [saved, setSaved] = useState(0)

  return (
    <Stack.right>
      <Window title="Inactive" width={22} height={5}>
        <Text>rounded border</Text>
      </Window>
      <Window
        title="Notes"
        width={30}
        height={5}
        titleBar={
          <Button border="none" onClick={() => setSaved(saved + 1)}>
            save
          </Button>
        }
      >
        <Text>Saved {saved} times</Text>
      </Window>
    </Stack.right>
  )
}

export default {width: 52, height: 5, title: 'Window', App}
