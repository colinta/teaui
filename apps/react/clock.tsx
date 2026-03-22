import React, {useState, useEffect, useRef} from 'react'
import {interceptConsoleLog} from '@teaui/core'
import {Digits, Stack, Style, Text, run} from '@teaui/react'

function pad(n: number, len: number): string {
  return String(n).padStart(len, '0')
}

function formatClock(now: Date): string {
  const date = `${now.getFullYear()}/${pad(now.getMonth() + 1, 2)}/${pad(now.getDate(), 2)}`
  const time = `${pad(now.getHours(), 2)}:${pad(now.getMinutes(), 2)}:${pad(now.getSeconds(), 2)}.${pad(now.getMilliseconds(), 3)}`
  return `${date}\n${time}`
}

export function ClockDemo() {
  const [clock, setClock] = useState(() => formatClock(new Date()))
  const rafRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    rafRef.current = setInterval(() => {
      setClock(formatClock(new Date()))
    }, 16)
    return () => {
      if (rafRef.current !== undefined) {
        clearInterval(rafRef.current)
      }
    }
  }, [])

  return (
    <Stack.down gap={1}>
      <Text>
        <Style bold foreground="cyan">
          Clock
        </Style>
        {' — '}Live date and time using Digits
      </Text>
      <Digits text={clock} />
    </Stack.down>
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  interceptConsoleLog()

  run(<ClockDemo />)
}
