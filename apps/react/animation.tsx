import React, {useState} from 'react'
import {interceptConsoleLog} from '@teaui/core'
import {Box, run, Stack, Text, Toggle, useAnimation} from '@teaui/react'

const DISTANCE = 30

export function AnimationTab() {
  const [paused, setPaused] = useState(false)
  const [reverse, setReverse] = useState(true)
  const animateX = useAnimation({
    apply(view, progress) {
      view.x = Math.round(progress * DISTANCE)
    },
    duration: 2,
    loops: true,
    reverse,
    easing: 'none',
    paused,
  })
  const animateA = useAnimation({
    apply(view, progress) {
      view.y = Math.round(progress * 4)
    },
    duration: 1,
    loops: true,
    reverse,
    easing: 'none',
    paused,
  })
  const animatePadding = useAnimation({
    apply(view, progress) {
      view.padding = {
        top: Math.round(progress * 8),
        bottom: Math.round(progress * 8),
        left: Math.round(progress * 5),
        right: Math.round(progress * 5),
      }
    },
    duration: 1,
    loops: true,
    reverse,
    easing: 'ease-in-out',
    paused,
  })

  return (
    <Stack.down gap={1} padding={1}>
      <Text>Stable React Animation</Text>
      <Stack.right gap={1}>
        <Toggle value={!paused} onChange={running => setPaused(!running)} />
        <Text>Animate</Text>
      </Stack.right>
      <Stack.right gap={1}>
        <Toggle value={reverse} onChange={setReverse} />
        <Text>Reverse</Text>
      </Stack.right>
      <Stack.down width={DISTANCE + 1}>
        <Text animations={[animateX]}>●</Text>
      </Stack.down>
      <Stack.right gap={2}>
        <Stack.down>
          <Box
            border="rounded"
            title="A"
            width={24}
            height={20}
            animations={animateA}
          />
        </Stack.down>
        <Box border="rounded" title="B" width={24} height={12}>
          <Box border="single" title="C" animations={animatePadding} />
        </Box>
      </Stack.right>
    </Stack.down>
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  interceptConsoleLog()

  run(<AnimationTab />)
}
