import React, {createRef} from 'react'
import {Drawer, Stack, Text, run} from '@teaui/react'

const openDrawer = createRef<React.ElementRef<typeof Drawer.right>>()

const [screen] = await run(
  <Stack.down width={32} height={10} gap={1}>
    <Drawer.right
      ref={openDrawer}
      isOpen
      title="Folders"
      hotKey="A-d"
      width={32}
      height={6}
      content={<Text>{'Messages\nPick a folder\nAlt+D toggles'}</Text>}
      drawer={<Text width={12}>{'Inbox\nDrafts\nArchive'}</Text>}
    />
    <Drawer
      location="left"
      hidesWhenClosed
      hotKey="A-h"
      title="Settings"
      width={32}
      height={3}
      content={
        <Text>
          {
            'Hidden when closed\nAlt+H opens hidden panel\nFull-width content, no chrome'
          }
        </Text>
      }
      drawer={<Text width={12}>Preferences</Text>}
    />
  </Stack.down>,
)

// Measure the panel, then settle its initial animation without a timer.
screen.render()
openDrawer.current?.receiveTick(1000)
screen.render()
