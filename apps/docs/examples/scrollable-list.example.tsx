import React from 'react'
import {ScrollableList, Style, Text} from '@teaui/react'

interface Project {
  name: string
  language: string
  stars: number
}

const data: Project[] = [
  {name: 'React', language: 'JavaScript', stars: 220000},
  {name: 'Vue', language: 'JavaScript', stars: 210000},
  {name: 'Angular', language: 'TypeScript', stars: 95000},
  {name: 'Svelte', language: 'JavaScript', stars: 78000},
  {name: 'Next.js', language: 'TypeScript', stars: 120000},
  {name: 'Nuxt', language: 'TypeScript', stars: 53000},
]

function App() {
  return (
    <ScrollableList
      data={data}
      renderItem={item => (
        <Text>
          {item.name}{' '}
          <Style dim>
            {item.language} ({formatStars(item.stars)})
          </Style>
        </Text>
      )}
    />
  )
}

function formatStars(stars: number): string {
  if (stars >= 1000) {
    return `${(stars / 1000).toFixed(0)}k ★`
  }
  return `${stars} ★`
}

export default {width: 40, height: 6, title: 'ScrollableList', App}
