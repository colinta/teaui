import React, {useState} from 'react'
import {FontStyle, Stack, Style, Text} from '@teaui/react'
import type {FontStyleValue} from '@teaui/react'

const INITIAL_VALUE: FontStyleValue = {
  bold: true,
  italic: false,
  underline: false,
  strikethrough: false,
}

function App() {
  const [value, setValue] = useState(INITIAL_VALUE)

  return (
    <Stack.down gap={1}>
      <FontStyle value={value} onChange={setValue} />
      <Text>
        Preview:{' '}
        <Style
          bold={value.bold}
          italic={value.italic}
          underline={value.underline}
          strikeout={value.strikethrough}
        >
          TeaUI
        </Style>
      </Text>
    </Stack.down>
  )
}

export default {width: 30, height: 5, title: 'FontStyle', App}
