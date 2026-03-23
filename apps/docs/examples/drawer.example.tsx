import React, {useState} from 'react'
import {Drawer, Text, Button, Stack} from '@teaui/react'

function App() {
  const [open, setOpen] = useState(true)

  return (
    <Drawer
      location="left"
      isOpen={open}
      onToggle={setOpen}
      drawer={
        <Stack.down>
          <Text>Sidebar</Text>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </Stack.down>
      }
      content={
        <Stack.down>
          <Text>Main Content</Text>
          <Button onClick={() => setOpen(true)}>Open</Button>
        </Stack.down>
      }
    />
  )
}

export default {width: 40, height: 10, title: 'Drawer', App}
