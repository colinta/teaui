import React from 'react'
import {Tabs, Text} from '@teaui/react'

function App() {
  return (
    <Tabs border>
      <Tabs.Section title="Info">
        <Text>Information panel</Text>
      </Tabs.Section>
      <Tabs.Section title="Settings">
        <Text>Settings panel</Text>
      </Tabs.Section>
      <Tabs.Section title="Help">
        <Text>Help panel</Text>
      </Tabs.Section>
    </Tabs>
  )
}

export default {width: 35, height: 5, title: 'Tabs', App}
