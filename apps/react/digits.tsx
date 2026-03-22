import React, {useState} from 'react'
import {interceptConsoleLog, type Border} from '@teaui/core'
import {
  Box,
  Digits,
  Dropdown,
  Separator,
  Slider,
  Stack,
  Style,
  Text,
  run,
} from '@teaui/react'

const BORDER_CHOICES: [string, Border][] = [
  ['single', 'single'],
  ['bold', 'bold'],
  ['double', 'double'],
  ['rounded', 'rounded'],
  ['dotted', 'dotted'],
]

export function DigitsTab() {
  const [width, setWidth] = useState(8)
  const [height, setHeight] = useState(5)
  const [border, setBorder] = useState<Border>('rounded')
  const area = width * height

  return (
    <Stack.down gap={1} flex={1}>
      <Text>
        <Style bold foreground="cyan">
          Digits Display
        </Style>{' '}
        — Adjust width and height to resize the box
      </Text>
      <Stack.right gap={2}>
        <Stack.down gap={1} flex={1}>
          <Stack.right gap={1}>
            <Text>Width: </Text>
            <Slider
              flex={1}
              direction="horizontal"
              range={[3, 40]}
              value={width}
              buttons
              step={1}
              border
              onChange={setWidth}
            />
          </Stack.right>
          <Stack.right gap={1}>
            <Text>Height:</Text>
            <Slider
              flex={1}
              direction="horizontal"
              range={[3, 20]}
              value={height}
              buttons
              step={1}
              border
              onChange={setHeight}
            />
          </Stack.right>
          <Stack.right gap={1}>
            <Text>Border:</Text>
            <Dropdown
              choices={BORDER_CHOICES}
              selected={border}
              onSelect={setBorder}
              height={1}
            />
          </Stack.right>
        </Stack.down>
      </Stack.right>
      <Separator.horizontal />
      <Stack.right gap={2}>
        <Box border={border} width={width} height={height}>
          <Text alignment="center">
            {width}×{height}
          </Text>
        </Box>
        <Digits text={`${width} x ${height} = ${area}`} />
      </Stack.right>
    </Stack.down>
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  interceptConsoleLog()

  run(<DigitsTab />)
}
