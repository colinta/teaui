import React, {useState} from 'react'
import {interceptConsoleLog, type Border} from '@teaui/core'
import {
  Box,
  Button,
  Checkbox,
  ConsoleLog,
  Scrollable,
  Separator,
  Stack,
  Style,
  Text,
  run,
} from '@teaui/react'
import {ClockDemo} from './clock.js'

const BORDERS: {name: string; border: Border}[] = [
  {name: 'single', border: 'single'},
  {name: 'double', border: 'double'},
  {name: 'rounded', border: 'rounded'},
  {name: 'bold', border: 'bold'},
  {name: 'dotted', border: 'dotted'},
]

export function MoreTab() {
  const [debug, setDebug] = useState(false)

  return (
    <Scrollable.down flex={1} gap={1}>
      {/* Clock */}
      <ClockDemo />

      <Separator.horizontal />

      {/* Borders */}
      <Text>
        <Style bold foreground="cyan">
          Border Styles
        </Style>
      </Text>
      <Stack.right gap={1}>
        {BORDERS.map(({name, border}) => (
          <Box key={name} border={border} width={16} height={5}>
            <Text alignment="center">{name}</Text>
          </Box>
        ))}
      </Stack.right>

      <Separator.horizontal />

      {/* Buttons */}
      <Text>
        <Style bold foreground="cyan">
          Buttons
        </Style>
      </Text>
      <Stack.right gap={1}>
        <Button title="Default" />
        <Button title="Primary" theme="primary" />
        <Button title="Secondary" theme="secondary" />
        <Button title="Tall" height={3} />
        <Button title="Primary Tall" height={3} theme="primary" />
      </Stack.right>

      <Separator.horizontal />

      {/* Console Log */}
      <Text>
        <Style bold foreground="cyan">
          Console Log
        </Style>
      </Text>
      <Stack.right gap={1}>
        <Checkbox title="Show Console" value={debug} onChange={setDebug} />
        <Button
          title="log()"
          onClick={() => console.info('Hello from console.info!')}
        />
        <Button
          title="debug()"
          onClick={() => console.error({action: 'error', ts: Date.now()})}
        />
        <Button
          title="warn()"
          onClick={() => console.warn('This is a warning!')}
        />
      </Stack.right>
      {debug ? <ConsoleLog height={8} /> : null}

      <Separator.horizontal />

      {/* Color swatches */}
      <Text>
        <Style bold foreground="cyan">
          Color Palette
        </Style>
      </Text>
      <Text>
        <Style foreground="red">■ red </Style>
        <Style foreground="green">■ green </Style>
        <Style foreground="blue">■ blue </Style>
        <Style foreground="yellow">■ yellow </Style>
        <Style foreground="magenta">■ magenta </Style>
        <Style foreground="cyan">■ cyan </Style>
        <Style foreground="white">■ white </Style>
      </Text>
      <Text>
        <Style foreground="brightRed">■ brightRed </Style>
        <Style foreground="brightGreen">■ brightGreen </Style>
        <Style foreground="brightBlue">■ brightBlue </Style>
        <Style foreground="brightYellow">■ brightYellow </Style>
        <Style foreground="brightMagenta">■ brightMagenta </Style>
        <Style foreground="brightCyan">■ brightCyan </Style>
      </Text>
    </Scrollable.down>
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  interceptConsoleLog()

  run(<MoreTab />)
}
