import React from 'react'
import {Pane, Stack, Text, run} from '@teaui/react'

await run(
  <Stack.down width={44} height={8}>
    <Pane border={true} collapsible={true} width={44} height={5}>
      <Text>{'Folders\nInbox\nDrafts'}</Text>
      <Text>{'Files\nOne.txt\nTwo.txt'}</Text>
      <Text>{'Preview\nSelected message\nDrag separators to resize'}</Text>
    </Pane>
    <Pane border={false} collapsible={false} width={44} height={3}>
      <Text>{'Pinned\nHome\nHelp'}</Text>
      <Text>
        {
          'Non-collapsible\nClick keeps the sidebar open\nDrag minimum: 4 columns'
        }
      </Text>
    </Pane>
  </Stack.down>,
)
