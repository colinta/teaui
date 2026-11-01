import React, {useState} from 'react'
import {Stack, Text, Toggle, useAnimation} from '@teaui/react'

const DISTANCE = 20

function App() {
  const [paused, setPaused] = useState(false)
  const animateX = useAnimation({
    apply(view, progress) {
      view.x = Math.round(progress * DISTANCE)
    },
    duration: 2,
    loops: true,
    easing: 'none',
    paused,
  })

  return (
    <Stack.down gap={1}>
      <Stack.right gap={1}>
        <Toggle value={!paused} onChange={running => setPaused(!running)} />
        <Text>Animate</Text>
      </Stack.right>
      <Stack.down width={DISTANCE + 1}>
        <Text animations={[animateX]}>●</Text>
      </Stack.down>
    </Stack.down>
  )
}

export default {width: 30, height: 5, title: 'Animation', App}
