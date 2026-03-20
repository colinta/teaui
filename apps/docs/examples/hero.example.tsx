import React from 'react'
import {
  Box,
  Button,
  Drawer,
  Dropdown,
  Input,
  Separator,
  Slider,
  Stack,
  Style,
  Tabs,
  Text,
} from '@teaui/react'

function App() {
  return (
    <Tabs border flex={1}>
      <Tabs.Section title="Home">
        <Drawer.left
          flex={1}
          theme="orange"
          isOpen
          drawer={
            <Stack.down width={14}>
              <Text>
                <Style bold>Navigation</Style>
              </Text>
              <Separator.horizontal />
              <Text>
                {'▸ '}
                <Style foreground="cyan">Dashboard</Style>
              </Text>
              <Text>{'  Components'}</Text>
              <Text>{'  Themes'}</Text>
              <Text>{'  Settings'}</Text>
            </Stack.down>
          }
          content={
            <Box border="rounded" flex={1}>
              <Stack.down flex={1}>
                <Stack.right gap={1}>
                  <Input value="Search…" flex={1} />
                  <Dropdown
                    theme="green"
                    choices={[
                      ['React', 'react'],
                      ['Core', 'core'],
                    ]}
                    selected="react"
                    height={1}
                  />
                </Stack.right>
                <Separator.horizontal />
                <Text wrap>
                  <Style bold foreground="cyan">
                    TeaUI
                  </Style>
                  {' — Build beautiful terminal apps with '}
                  <Style bold>React JSX</Style>
                  {'. Full layout, input, mouse & focus.'}
                </Text>
                <Stack.right gap={1}>
                  <Slider
                    flex={1}
                    direction="horizontal"
                    range={[0, 10]}
                    value={9}
                  />
                  <Text>
                    <Style bold>9</Style>/10★
                  </Text>
                </Stack.right>
                <Button title="Get Started" height={3} theme="primary" />
              </Stack.down>
            </Box>
          }
        />
      </Tabs.Section>
      <Tabs.Section title="Docs">
        <Text>Documentation</Text>
      </Tabs.Section>
      <Tabs.Section title="API">
        <Text>API Reference</Text>
      </Tabs.Section>
    </Tabs>
  )
}

export default {width: 55, height: 16, title: 'Output', App}
