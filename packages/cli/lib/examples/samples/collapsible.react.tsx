import React from 'react'
import {Collapsible, Stack, Text, run} from '@teaui/react'

await run(
  <Stack.down width={32} height={8} gap={1}>
    <Collapsible
      isCollapsed
      preview={2}
      collapsed={
        <Text>{'Two-line preview\nClick to expand\nHidden preview line'}</Text>
      }
      expanded={<Text>Hidden expanded content</Text>}
    />
    <Collapsible
      isCollapsed={false}
      collapsed={<Text>Replaced preview</Text>}
      expanded={<Text>{'Expanded content\nClick to collapse'}</Text>}
    />
    <Collapsible
      isCollapsed={false}
      showCollapsed
      collapsed={<Text>Summary stays visible</Text>}
      expanded={<Text>Additional details</Text>}
    />
  </Stack.down>,
)
