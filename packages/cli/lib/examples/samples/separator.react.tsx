import React from 'react'
import {Separator, Stack, Text, run} from '@teaui/react'

const borders = [
  'single',
  'leading',
  'trailing',
  'bold',
  'dash',
  'dash2',
  'dash3',
  'dash4',
  'double',
] as const

function App() {
  return (
    <Stack.down width={36} height={20}>
      <Text>Horizontal borders</Text>
      {borders.map(border => (
        <Stack.right key={border} height={1}>
          <Text width={10}>{border}</Text>
          <Separator direction="horizontal" border={border} flex={1} />
        </Stack.right>
      ))}
      <Text>Vertical: single / bold / double</Text>
      <Stack.right height={3}>
        <Text width={8}>Left</Text>
        <Separator.vertical />
        <Text width={8}>Middle</Text>
        <Separator.vertical border="bold" />
        <Text width={8}>Right</Text>
        <Separator.vertical border="double" />
      </Stack.right>
      <Text>Numeric padding: 1 (five rows)</Text>
      <Separator.horizontal border="double" padding={1} />
    </Stack.down>
  )
}

await run(<App />)
