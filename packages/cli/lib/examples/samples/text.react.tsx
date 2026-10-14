import React from 'react'
import {Stack, Text, run} from '@teaui/react'

const WIDTH = 36
const HEIGHT = 11
const NARROW_WIDTH = 18
const headingStyle = {bold: true, foreground: '#ffaa00'} as const
const centeredStyle = {italic: true, foreground: '#88aaff'} as const
const rightStyle = {
  underline: true,
  foreground: '#00ff88',
  background: '#202040',
} as const
const wrappedStyle = {foreground: '#00ff88'} as const

function App() {
  return (
    <Stack.down width={WIDTH} height={HEIGHT}>
      <Text style={headingStyle}>Text: style, wrap, alignment</Text>
      <Text width={WIDTH} alignment="left">
        Left aligned
      </Text>
      <Text width={WIDTH} alignment="center" style={centeredStyle}>
        Centered
      </Text>
      <Text width={WIDTH} alignment="right" style={rightStyle}>
        Right aligned
      </Text>
      <Text width={NARROW_WIDTH} height={3} wrap style={wrappedStyle}>
        Wrap: words stay together with room to spare
      </Text>
      <Text width={NARROW_WIDTH} wrap={false}>
        No wrap: this line is clipped here.
      </Text>
      <Text>{'First source line\nSecond source line'}</Text>
      <Text font="monospace">TeaUI 123</Text>
    </Stack.down>
  )
}

await run(<App />)
