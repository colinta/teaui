import React from 'react'
import {run, Stack, Text, ZStack, type ZStackProps} from '@teaui/react'

const CELL_WIDTH = 14
const CELL_HEIGHT = 3
const BACKGROUND = Array(CELL_HEIGHT).fill('.'.repeat(CELL_WIDTH)).join('\n')

function LocationExample({
  location,
}: {
  location: NonNullable<ZStackProps['location']>
}) {
  return (
    <Stack.down width={CELL_WIDTH}>
      <Text>{location}</Text>
      <ZStack width={CELL_WIDTH} height={CELL_HEIGHT} location={location}>
        <Text>{BACKGROUND}</Text>
        <Text>OK</Text>
        <Text isVisible={false}>hidden</Text>
      </ZStack>
    </Stack.down>
  )
}

function App() {
  return (
    <Stack.down width={44} height={15}>
      <Text>Later children overwrite earlier ones</Text>
      <ZStack>
        <Text>0123456789</Text>
        <Text>OVER</Text>
      </ZStack>
      <Text>location: natural-size layers in 14x3 cells</Text>
      <Stack.right gap={1}>
        <LocationExample location="top-left" />
        <LocationExample location="top-center" />
        <LocationExample location="top-right" />
      </Stack.right>
      <Stack.right gap={1}>
        <LocationExample location="left" />
        <LocationExample location="center" />
        <LocationExample location="right" />
      </Stack.right>
      <Stack.right gap={1}>
        <LocationExample location="bottom-left" />
        <LocationExample location="bottom-center" />
        <LocationExample location="bottom-right" />
      </Stack.right>
    </Stack.down>
  )
}

await run(<App />)
