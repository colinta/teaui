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
  {name: 'Solid', language: 'TypeScript', stars: 32000},
  {name: 'Preact', language: 'JavaScript', stars: 37000},
  {name: 'Astro', language: 'TypeScript', stars: 47000},
  {name: 'Remix', language: 'TypeScript', stars: 30000},
  {name: 'Ember', language: 'JavaScript', stars: 22000},
  {name: 'Lit', language: 'TypeScript', stars: 19000},
  {name: 'Qwik', language: 'TypeScript', stars: 21000},
  {name: 'Alpine', language: 'JavaScript', stars: 28000},
  {name: 'Htmx', language: 'JavaScript', stars: 39000},
  {name: 'Backbone', language: 'JavaScript', stars: 28000},
  {name: 'Mithril', language: 'JavaScript', stars: 14000},
  {name: 'Inferno', language: 'JavaScript', stars: 16000},
  {name: 'Stencil', language: 'TypeScript', stars: 12000},
  {name: 'Gatsby', language: 'JavaScript', stars: 55000},
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
