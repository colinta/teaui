import React from 'react'
import {interceptConsoleLog, type Border, type LegendItem} from '@teaui/core'
import {
  Legend,
  Scrollable,
  Separator,
  Stack,
  Style,
  Text,
  run,
} from '@teaui/react'

export function LegendTab() {
  return (
    <Scrollable flex={1}>
      <Stack.down gap={1}>
        <Text>
          <Style bold foreground="cyan">
            Inline Legend
          </Style>
        </Text>
        <Legend
          items={[
            {key: ['up', 'down'], label: 'navigate'},
            {key: 'enter', label: 'select'},
            {key: 'q', label: 'quit'},
            {key: '?', label: 'help'},
            {key: 'escape', label: 'cancel'},
          ]}
        />
        <Separator.horizontal />
        <Text>
          <Style bold foreground="cyan">
            Bullet Separator
          </Style>
        </Text>
        <Legend
          items={[
            {key: 's', label: 'stop'},
            {key: 'r', label: 'reset'},
            {key: 'q', label: 'quit'},
          ]}
          separator=" • "
        />
        <Separator.horizontal />
        <Text>
          <Style bold foreground="cyan">
            Modifier Keys
          </Style>
        </Text>
        <Legend
          items={[
            {key: ['cmd', 'S'], label: 'save'},
            {key: ['ctrl', 'C'], label: 'quit'},
            {key: 'Ctrl+Z', label: 'undo'},
            {key: 'tab', label: 'switch'},
            {key: 'space', label: 'toggle'},
            {key: 'backspace', label: 'delete'},
          ]}
        />
      </Stack.down>
    </Scrollable>
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  interceptConsoleLog()
  run(<LegendTab />)
}
