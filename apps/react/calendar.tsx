import React, {useState, useRef} from 'react'
import {
  Calendar,
  Scrollable,
  Stack,
  Style,
  Text,
  ConsoleLog,
  run,
  Button,
} from '@teaui/react'
import {interceptConsoleLog, ConsoleLog as WrConsoleLog} from '@teaui/core'

// ── Tab: Calendar ───────────────────────────────────────────────────────────

export function CalendarTab() {
  const logRef = useRef<WrConsoleLog>(null)
  const [date, setDate] = useState(new Date())
  const [visibleDate, setVisibleDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  )
  const [rangeStart, setRangeStart] = useState<Date | undefined>()
  const [rangeEnd, setRangeEnd] = useState<Date | undefined>()
  const [rangeVisible, setRangeVisible] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  )

  return (
    <Stack.down gap={1}>
      <Text>
        <Style bold foreground="cyan">
          Calendar
        </Style>{' '}
        — Date picker with month/year navigation
      </Text>

      <Stack.right gap={4}>
        <Stack.down>
          <Text>
            <Style bold>Single selection</Style>
          </Text>
          <Calendar
            width={22}
            date={date}
            visibleDate={visibleDate}
            onChangeVisible={setVisibleDate}
            onChange={d1 => setDate(d1)}
            theme="blue"
          />
          <Text>
            Selected:{' '}
            <Style foreground="green">{date.toLocaleDateString()}</Style>
          </Text>
        </Stack.down>

        <Stack.down>
          <Text>
            <Style bold>Range selection</Style>
          </Text>
          <Calendar
            width={22}
            date={rangeStart ?? new Date()}
            visibleDate={rangeVisible}
            onChangeVisible={setRangeVisible}
            selection="range"
            onChange={(d1, d2) => {
              setRangeStart(d1)
              setRangeEnd(d2)
            }}
            theme="green"
          />
          <Text>
            Range:{' '}
            <Style foreground="green">
              {rangeStart && rangeEnd
                ? `${rangeStart.toLocaleDateString()} – ${rangeEnd.toLocaleDateString()}`
                : 'none'}
            </Style>
          </Text>
        </Stack.down>

        <Stack.down>
          <Text>
            <Style bold>Monday start</Style>
          </Text>
          <Calendar
            width={22}
            date={date}
            onChange={d1 => setDate(d1)}
            firstDayOfWeek={1}
            theme="orange"
          />
        </Stack.down>
      </Stack.right>
      <Button hotKey="C-k" onClick={() => logRef.current!.clear()}>
        Clear Logs
      </Button>
      <ConsoleLog ref={logRef} flex={1} />
    </Stack.down>
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  interceptConsoleLog()
  run(<CalendarTab />)
}
