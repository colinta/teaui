import React from 'react'
import {H1, H2, H3, H4, H5, H6, Header, Stack, run} from '@teaui/react'

// Header is configurable; H1–H6 provide convenient presets.
function App() {
  return (
    <Stack.down width={48} height={19} gap={1}>
      <H1 text="H1: Double / bold" />
      <H2>H2: Heavy / bold</H2>
      <H3 text="H3: Single / bold" />
      <H4>H4: Single / normal</H4>
      <H5 text="H5: Single / dim" />
      <H6>H6: No border / dim</H6>
      <Header border="double" font="double-struck" bold={false} dim>
        Custom font
      </Header>
    </Stack.down>
  )
}

await run(<App />)
