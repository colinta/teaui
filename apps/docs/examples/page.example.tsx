import React from 'react'
import {Page, Text} from '@teaui/react'

function App() {
  return (
    <Page>
      <Text heading="Welcome">Welcome to the Page component!</Text>
      <Text heading="Features">Animated slide transitions</Text>
      <Text heading="Help">Use PageUp/PageDown to navigate</Text>
    </Page>
  )
}

export default {width: 35, height: 5, title: 'Page', App}
