import React, {useState} from 'react'
import {Input, Stack, Text, run} from '@teaui/react'

function App() {
  const [name, setName] = useState('TeaUI')
  const [status, setStatus] = useState('Ready')
  const [note, setNote] = useState('')
  const [wrapped, setWrapped] = useState(
    'Wrapping keeps this one logical line.',
  )
  const [multiline, setMultiline] = useState('first line\nsecond line')
  const [font, setFont] = useState('TeaUI 123')
  const [styled, setStyled] = useState('Styled text')

  return (
    <Stack.down width={36} height={17}>
      <Text>Name (Enter submits)</Text>
      <Input
        value={name}
        height={1}
        onChange={value => {
          setName(value)
          setStatus(`Editing: ${value}`)
        }}
        onSubmit={value => {
          setStatus(`Submitted: ${value}`)
        }}
      />
      <Text>{status}</Text>
      <Text>Empty placeholder</Text>
      <Input
        value={note}
        placeholder="Type a note..."
        onChange={setNote}
        height={1}
      />
      <Text>Wrapped single line</Text>
      <Input value={wrapped} onChange={setWrapped} wrap width={24} height={2} />
      <Text>Multiline (Enter adds a line)</Text>
      <Input
        value={multiline}
        onChange={setMultiline}
        multiline
        wrap
        height={3}
      />
      <Text>Unicode font</Text>
      <Input value={font} onChange={setFont} font="double-struck" height={1} />
      <Text>ANSI format (value unchanged)</Text>
      <Input
        value={styled}
        onChange={setStyled}
        format={text => `\x1b[1;36m${text}\x1b[0m`}
        height={1}
      />
    </Stack.down>
  )
}

await run(<App />)
