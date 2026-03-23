import React from 'react'
import {Page, Text} from '@teaui/react'

function App() {
  return (
    <Page>
      <Page.Section title="Welcome">
        <Text>Welcome to the Page component!</Text>
      </Page.Section>
      <Page.Section title="Features">
        <Text>Animated slide transitions</Text>
      </Page.Section>
      <Page.Section title="Help">
        <Text>Use PageUp/PageDown to navigate</Text>
      </Page.Section>
    </Page>
  )
}

export default {width: 35, height: 5, title: 'Page', App}
