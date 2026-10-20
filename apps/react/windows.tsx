import React, {useState} from 'react'
import {interceptConsoleLog} from '@teaui/core'
import {
  Button,
  Desktop,
  Input,
  Stack,
  Text,
  ToggleGroup,
  Window,
  run,
} from '@teaui/react'

type Layout = 'floating' | 'tiled'
const LAYOUTS: Layout[] = ['floating', 'tiled']

let nextId = 4

export function WindowsTab() {
  const [layout, setLayout] = useState<Layout>('floating')
  const [windows, setWindows] = useState([1, 2, 3])
  const [saved, setSaved] = useState(0)

  function close(id: number) {
    setWindows(windows => windows.filter(other => other !== id))
  }

  return (
    <Stack.down flex={1}>
      <Stack.right gap={1}>
        <ToggleGroup
          titles={LAYOUTS}
          selected={[LAYOUTS.indexOf(layout)]}
          onChange={index => setLayout(LAYOUTS[index] ?? 'floating')}
        />
        <Button onClick={() => setWindows(windows => [...windows, nextId++])}>
          New Window
        </Button>
      </Stack.right>
      <Desktop layout={layout} flex={1}>
        {windows.map((id, index) => (
          <Window
            key={id}
            title={`Window ${id}`}
            width={32}
            height={8}
            onClose={() => close(id)}
            titleBar={
              index === 0 ? (
                <Button border="none" onClick={() => setSaved(saved + 1)}>
                  save
                </Button>
              ) : undefined
            }
          >
            <Stack.down padding={1} gap={1}>
              <Text>
                {index === 0
                  ? `Saved ${saved} times`
                  : 'Drag the title bar, or the borders'}
              </Text>
              <Input placeholder="focus me to raise the window" />
            </Stack.down>
          </Window>
        ))}
      </Desktop>
    </Stack.down>
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  interceptConsoleLog()

  run(<WindowsTab />)
}
