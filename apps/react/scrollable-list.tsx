import React, {useState, useCallback} from 'react'
import {interceptConsoleLog} from '@teaui/core'
import {
  Align,
  Input,
  ScrollableList,
  Separator,
  Space,
  Stack,
  Style,
  Text,
  run,
} from '@teaui/react'

interface Movie {
  title: string
  actors: string[]
  released: number
}

const MOVIES: Movie[] = [
  {
    title: 'Near Dark',
    actors: ['Adrian Pasdar', 'Jenny Wright', 'Lance Henriksen'],
    released: 1987,
  },
  {
    title: 'Point Break',
    actors: ['Patrick Swayze', 'Keanu Reeves', 'Lori Petty'],
    released: 1991,
  },
  {
    title: 'Strange Days',
    actors: ['Ralph Fiennes', 'Angela Bassett', 'Juliette Lewis'],
    released: 1995,
  },
  {
    title: 'The Weight of Water',
    actors: ['Catherine McCormack', 'Sean Penn', 'Elizabeth Hurley'],
    released: 2000,
  },
  {
    title: 'K-19: The Widowmaker',
    actors: ['Harrison Ford', 'Liam Neeson', 'Peter Sarsgaard'],
    released: 2002,
  },
  {
    title: 'The Hurt Locker',
    actors: ['Jeremy Renner', 'Anthony Mackie', 'Brian Geraghty'],
    released: 2008,
  },
  {
    title: 'Zero Dark Thirty',
    actors: ['Jessica Chastain', 'Jason Clarke', 'Joel Edgerton'],
    released: 2012,
  },
  {
    title: 'Detroit',
    actors: ['John Boyega', 'Will Poulter', 'Algee Smith'],
    released: 2017,
  },
]

export function ListTab() {
  const [query, setQuery] = useState('')

  const filter = useCallback(
    (item: Movie) => {
      if (query.length === 0) return true
      const q = query.toLowerCase()
      return (
        item.title.toLowerCase().includes(q) ||
        item.actors.some(a => a.toLowerCase().includes(q))
      )
    },
    [query],
  )

  return (
    <Stack.down flex={1}>
      <Input placeholder="Filter…" onChange={setQuery} />
      <Separator.horizontal />
      <ScrollableList
        data={MOVIES}
        filter={filter}
        renderItem={item => (
          <Stack.down>
            <Text padding={{left: 2}}>
              <Style bold foreground="yellow">
                {item.title}
              </Style>
            </Text>
            <Align>
              <Align.Row>
                <Space width={2} />
                <Text>
                  {'  '}
                  <Style foreground="cyan">Actors</Style>
                </Text>
                <Text>
                  <Style foreground="cyan">{item.actors.join(', ')}</Style>
                </Text>
              </Align.Row>
              <Align.Row>
                <Text>
                  {'  '}
                  <Style foreground="green">Released</Style>
                </Text>
                <Text>
                  <Style foreground="green">{item.released}</Style>
                </Text>
              </Align.Row>
            </Align>
          </Stack.down>
        )}
        flex={1}
      />
    </Stack.down>
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  interceptConsoleLog()

  run(<ListTab />)
}
