import React from 'react'
import {Accordion, Text} from '@teaui/react'

export default function App() {
  return (
    <Accordion>
      <Accordion.Section title="Section 1" isOpen>
        <Text>Hello, world!</Text>
      </Accordion.Section>
      <Accordion.Section title="Section 2">
        <Text>More content</Text>
      </Accordion.Section>
      <Accordion.Section title="Section 3">
        <Text>Even more</Text>
      </Accordion.Section>
    </Accordion>
  )
}
