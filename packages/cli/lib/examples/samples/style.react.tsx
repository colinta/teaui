import React from 'react'
import {Stack, Style, Text, run} from '@teaui/react'

const objectStyle = {
  bold: false,
  underline: true,
  foreground: '#00ff88',
  background: '#202040',
} as const

function App() {
  return (
    <Stack.down width={56} height={5}>
      <Text>
        Inline: plain <Style bold>bold</Style> <Style italic>italic</Style>{' '}
        <Style underline>underlined</Style> <Style strikeout>struck</Style>
      </Text>
      <Text>
        Nested:{' '}
        <Style bold foreground="#ffaa00">
          outer <Style italic>nested</Style>{' '}
          <Style bold={false} foreground="cyan">
            override
          </Style>{' '}
          restored
        </Style>{' '}
        plain
      </Text>
      <Text>
        Object:{' '}
        <Style bold style={objectStyle}>
          object wins
        </Style>{' '}
        plain
      </Text>
      <Text>
        Flags: <Style dim>dim</Style> <Style inverse>inverse</Style>{' '}
        <Style bold dim>
          bold wins
        </Style>{' '}
        <Style bold>
          <Style dim>dim wins</Style>
        </Style>{' '}
        plain
      </Text>
      <Text>
        Link:{' '}
        <Style
          link="https://example.com/teaui"
          linkParams="id=style-example"
          underline
        >
          TeaUI
        </Style>{' '}
        plain
      </Text>
    </Stack.down>
  )
}

await run(<App />)
