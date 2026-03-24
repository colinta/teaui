import {Input, ScrollableList, Separator, Stack, Style, Text} from '@teaui/core'
import {demo} from './demo.js'

interface Movie {
  title: string
  actors: string[]
  released: number
}

const data: Movie[] = [
  {
    title: 'Bottle Rocket',
    actors: ['Owen Wilson', 'Luke Wilson', 'Robert Musgrave'],
    released: 1996,
  },
  {
    title: 'Rushmore',
    actors: ['Jason Schwartzman', 'Bill Murray', 'Olivia Williams'],
    released: 1998,
  },
  {
    title: 'The Royal Tenenbaums',
    actors: ['Gene Hackman', 'Anjelica Huston', 'Ben Stiller'],
    released: 2001,
  },
  {
    title: 'The Life Aquatic with Steve Zissou',
    actors: ['Bill Murray', 'Owen Wilson', 'Cate Blanchett'],
    released: 2004,
  },
  {
    title: 'The Darjeeling Limited',
    actors: ['Owen Wilson', 'Adrien Brody', 'Jason Schwartzman'],
    released: 2007,
  },
  {
    title: 'Fantastic Mr. Fox',
    actors: ['George Clooney', 'Meryl Streep', 'Bill Murray'],
    released: 2009,
  },
  {
    title: 'Moonrise Kingdom',
    actors: ['Jared Gilman', 'Kara Hayward', 'Bruce Willis'],
    released: 2012,
  },
  {
    title: 'The Grand Budapest Hotel',
    actors: ['Ralph Fiennes', 'Tony Revolori', 'F. Murray Abraham'],
    released: 2014,
  },
  {
    title: 'Isle of Dogs',
    actors: ['Bryan Cranston', 'Edward Norton', 'Bill Murray'],
    released: 2018,
  },
  {
    title: 'The French Dispatch',
    actors: ['Benicio del Toro', 'Adrien Brody', 'Tilda Swinton'],
    released: 2021,
  },
  {
    title: 'Asteroid City',
    actors: ['Jason Schwartzman', 'Scarlett Johansson', 'Tom Hanks'],
    released: 2023,
  },
]

let query = ''

const input = new Input({
  placeholder: 'Filter…',
  onChange(text) {
    query = text.toLowerCase()
    list.refresh()
  },
})

const list = new ScrollableList<Movie>({
  data,
  filter: item =>
    query.length === 0 ||
    item.title.toLowerCase().includes(query) ||
    item.actors.some(a => a.toLowerCase().includes(query)),
  renderItem(item) {
    return Stack.down({
      children: [
        new Text({text: `  ${item.title}`, style: titleStyle()}),
        new Text({
          text: `  Actors   ${PIPE} ${item.actors.join(', ')}`,
          style: actorsStyle(),
        }),
        new Text({
          text: `  Released ${PIPE} ${item.released}`,
          style: releasedStyle(),
        }),
      ],
    })
  },
  flex: 1,
})

demo(
  Stack.down({
    children: [input, Separator.horizontal(), list],
  }),
)

function titleStyle(): Style {
  return new Style({bold: true, foreground: 'yellow'})
}

function actorsStyle(): Style {
  return new Style({foreground: 'cyan'})
}

function releasedStyle(): Style {
  return new Style({foreground: 'green'})
}

const PIPE = '│'
