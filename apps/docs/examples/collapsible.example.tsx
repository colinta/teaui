import React, {useState} from 'react'
import {Collapsible, Text, Button, Stack, Br} from '@teaui/react'

function App() {
  const [open, setOpen] = useState(false)

  return (
    <Stack.down>
      <Collapsible
        isCollapsed={!open}
        collapsed={<Button onClick={() => setOpen(true)}>Show more ▸</Button>}
        expanded={
          <Stack.down>
            <Text>Here is the full content that</Text>
            <Text>was hidden behind the button.</Text>
            <Button onClick={() => setOpen(false)}>Show less ▴</Button>
          </Stack.down>
        }
      />
      <Collapsible
        isCollapsed={!open}
        collapsed={
          <Button onClick={() => setOpen(true)}>
            Multiple ▸<Br />
            Lines ▸
          </Button>
        }
        expanded={
          <Stack.down>
            <Text>Here is the full content that</Text>
            <Text>was hidden behind the button.</Text>
            <Button onClick={() => setOpen(false)}>Show less ▴</Button>
          </Stack.down>
        }
      />
    </Stack.down>
  )
}

export default {width: 35, height: 5, title: 'Collapsible', App}
