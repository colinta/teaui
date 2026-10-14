import React from 'react'
import {run, Space, Stack, Tabs, Text} from '@teaui/react'

function App() {
  return (
    <Stack.down width={36} height={10}>
      <Text>Bordered: second tab selected</Text>
      <Tabs border={true} selected={1} width={36} height={4}>
        <Tabs.Section title="Info">
          <Text>Information panel</Text>
        </Tabs.Section>
        <Tabs.Section title="Settings">
          <Text>Change your preferences.</Text>
        </Tabs.Section>
        <Tabs.Section title="Help">
          <Text>Help panel</Text>
        </Tabs.Section>
      </Tabs>
      <Space height={1} />
      <Text>Borderless: first tab selected</Text>
      <Tabs border={false} selected={0} width={36} height={3}>
        <Tabs.Section title="Overview">
          <Text>Welcome to TeaUI.</Text>
        </Tabs.Section>
        <Tabs.Section title="Details">
          <Text>More details here.</Text>
        </Tabs.Section>
      </Tabs>
    </Stack.down>
  )
}

await run(<App />)
