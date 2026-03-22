import React from 'react'
import {interceptConsoleLog} from '@teaui/core'
import {
  Accordion,
  Box,
  Drawer,
  Separator,
  Stack,
  Style,
  Text,
  run,
} from '@teaui/react'

export function DrawerTab() {
  return (
    <Drawer.left
      flex={1}
      theme="secondary"
      hotKey="C-o"
      drawer={
        <Stack.down maxWidth={35}>
          <Text>
            <Style bold>Drawer Menu</Style>
          </Text>
          <Separator.horizontal />
          <Accordion multiple>
            {Array.from({length: 5}, (_, i) => (
              <Accordion.Section key={i} title={`Menu ${i + 1}`}>
                <Text>
                  Item {i + 1} content{'\n'}with multiple lines
                </Text>
              </Accordion.Section>
            ))}
          </Accordion>
        </Stack.down>
      }
      content={
        <Stack.down flex={1} gap={1} padding={1}>
          <Text>
            <Style bold foreground="cyan">
              Drawer Demo
            </Style>
          </Text>
          <Text wrap>
            Press Ctrl-O or drag the edge to toggle the drawer on the left.
            Drawers can be placed on any side: top, right, bottom, or left.
          </Text>
          <Box border="rounded" flex={1}>
            <Text alignment="center" wrap>
              Main content area. The drawer overlays from the left side.
            </Text>
          </Box>
        </Stack.down>
      }
    />
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  interceptConsoleLog()

  run(<DrawerTab />)
}
