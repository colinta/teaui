import React from 'react'
import {Callout, Stack, Text} from '@teaui/react'

function App() {
  return (
    <Stack.down gap={1}>
      <Callout purpose="primary">
        <Text heading="Note">Remember to save your work before closing.</Text>
      </Callout>
      <Callout purpose="cancel">
        <Text>This action cannot be undone.</Text>
      </Callout>
      <Callout purpose="proceed">
        <Text heading="Success">Your changes have been saved.</Text>
      </Callout>
    </Stack.down>
  )
}

export default {width: 40, height: 14, title: 'Callout', App}
