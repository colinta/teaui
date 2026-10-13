import React from 'react'
import {Skeleton, Space, Stack, Text} from '@teaui/react'

const LABEL_WIDTH = 14

function App() {
  return (
    <Stack.down gap={1}>
      <Example label="rect">
        <Stack.right gap={2}>
          <Skeleton shape="rect" width={4} height={4} />
          <Skeleton shape="rect" width={10} height={4} />
        </Stack.right>
      </Example>

      <Example label="rounded-rect">
        <Stack.right gap={2}>
          <Skeleton shape="rounded-rect" width={4} height={4} />
          <Skeleton shape="rounded-rect" width={10} height={4} />
        </Stack.right>
      </Example>

      <Example label="circle">
        <Stack.right gap={2}>
          <Skeleton shape="circle" width={4} height={4} />
          <Skeleton shape="circle" width={10} height={4} />
        </Stack.right>
      </Example>

      <Example>
        <Stack.right gap={2}>
          <Skeleton shape="circle" width={9} height={6} />
          <Skeleton shape="circle" width={13} height={6} />
        </Stack.right>
      </Example>

      <Example label="row">
        <Stack.down>
          <RowPair count={1} />
          <Space height={1} />
          <RowPair count={2} />
        </Stack.down>
      </Example>

      <Example label="column">
        <Stack.right>
          <ColumnGroup height={4} count={1} />
          <Space width={2} />
          <ColumnGroup height={6} count={1} />
          <Space width={4} />
          <ColumnGroup height={4} count={2} />
          <Space width={4} />
          <ColumnGroup height={6} count={2} />
        </Stack.right>
      </Example>
    </Stack.down>
  )
}

function Example({
  label = '',
  children,
}: {
  label?: string
  children: React.ReactNode
}) {
  return (
    <Stack.right>
      <Text width={LABEL_WIDTH}>{label}</Text>
      {children}
    </Stack.right>
  )
}

function RowPair({count}: {count: number}) {
  return (
    <Stack.right>
      <RowGroup width={3} count={count} />
      <Space width={6} />
      <RowGroup width={7} count={count} />
    </Stack.right>
  )
}

function RowGroup({width, count}: {width: number; count: number}) {
  return (
    <Stack.down>
      {Array.from({length: count}, (_, index) => (
        <Skeleton key={index} shape="row" width={width} />
      ))}
    </Stack.down>
  )
}

function ColumnGroup({height, count}: {height: number; count: number}) {
  return (
    <Stack.right>
      {Array.from({length: count}, (_, index) => (
        <Skeleton key={index} shape="column" height={height} />
      ))}
    </Stack.right>
  )
}

export default {width: 40, height: 33, title: 'Skeleton', App}
