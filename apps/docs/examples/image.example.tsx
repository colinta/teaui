import React from 'react'
import {Box} from '@teaui/react'
import {Image} from '@teaui/image/react'

function App() {
  return (
    <Box border="rounded" flex={1}>
      <Image source="./static/minime.png" flex={1} />
    </Box>
  )
}

export default {width: 42, height: 22, title: 'Image', async: true, App}
