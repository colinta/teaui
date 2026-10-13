import React, {useState} from 'react'
import {BORDERS, interceptConsoleLog} from '@teaui/core'
import {Box, Checkbox, Scrollable, Space, Stack, Text, run} from '@teaui/react'

export function BoxDemo() {
  const [titled, setTitled] = useState(false)

  return (
    <Stack.down flex={1} gap={1}>
      <Checkbox title="Titled" value={titled} onChange={setTitled} />
      <Scrollable.down flex={1} gap={1}>
        {toRows(BORDERS).map(([left, right]) => (
          <Stack.right key={left} height={5}>
            <Space flex={1} />
            <Box border={left} flex={2} title={titled ? left : undefined}>
              {titled ? null : <Text alignment="center">{left}</Text>}
            </Box>
            <Space flex={1} />
            {right ? (
              <Box border={right} flex={2} title={titled ? right : undefined}>
                {titled ? null : <Text alignment="center">{right}</Text>}
              </Box>
            ) : (
              <Space flex={2} />
            )}
            <Space flex={1} />
          </Stack.right>
        ))}
      </Scrollable.down>
    </Stack.down>
  )
}

function toRows<T>(items: readonly T[]): [T, T | undefined][] {
  const rows: [T, T | undefined][] = []
  for (let index = 0; index < items.length; index += 2) {
    rows.push([items[index], items[index + 1]])
  }
  return rows
}

if (import.meta.url === `file://${process.argv[1]}`) {
  interceptConsoleLog()

  run(<BoxDemo />)
}
