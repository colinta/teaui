import {existsSync, readFileSync} from 'node:fs'

import {HeadlessProgram, Screen, Root, type View} from '@teaui/core'

import type {ComponentExample} from './types.js'

const WIDTH = 48
const HEIGHT = 4
let importSequence = 0

export const autoLegendExample: ComponentExample = {
  name: 'auto-legend',
  availability: 'both',
  description:
    'Show focused control hints and labeled HotKey shortcuts; updates as focus changes',
  props: [
    {
      name: 'purpose',
      type: 'Palette | Purpose',
      description: 'Inherited palette for highlighted keys and muted labels',
      availability: 'both',
    },
    {
      name: 'width',
      type: "number | 'fill' | 'shrink' | 'natural'",
      description:
        'Inherited width constraint; hints wrap to fit available columns',
      availability: 'both',
    },
    {
      name: 'height',
      type: "number | 'fill' | 'shrink' | 'natural'",
      description: 'Inherited height constraint; naturally fits wrapped rows',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<AutoLegend>',
      description: 'Reference to the underlying Core AutoLegend',
      availability: 'react',
    },
  ],
  source: {
    react: () => readExampleSource('auto-legend.react.tsx'),
    core: () => readExampleSource('auto-legend.core.js'),
  },
  render: {
    react: renderReact,
    core: renderCore,
  },
}

function readExampleSource(filename: string): string {
  return readFileSync(
    new URL(`./${filename}`, import.meta.url),
    'utf8',
  ).trimEnd()
}

function renderReact(): Promise<string> {
  return renderSample('auto-legend.react.tsx')
}

function renderCore(): Promise<string> {
  return renderSample('auto-legend.core.js')
}

async function renderSample(filename: string): Promise<string> {
  const originalStart = Screen.start
  let screen: Screen | undefined
  let program: HeadlessProgram | undefined

  // AutoLegend needs real focus to discover the active control's hints.
  // The shared capture helper deliberately starts an unfocused screen.
  const start = async (view: View = new Root()) => {
    program = new HeadlessProgram({cols: WIDTH, rows: HEIGHT})
    screen = new Screen(program, view)
    screen.start()
    return [screen, program, view]
  }

  Screen.start = start as unknown as typeof Screen.start
  try {
    const url = new URL(`./${filename}`, import.meta.url)
    if (url.pathname.endsWith('.tsx')) {
      const javascriptUrl = new URL(url)
      javascriptUrl.pathname = `${javascriptUrl.pathname.slice(0, -4)}.js`
      if (existsSync(javascriptUrl)) {
        url.pathname = javascriptUrl.pathname
      }
    }
    url.searchParams.set('capture', String(importSequence++))
    await import(url.href)
    if (!program) {
      throw new Error(`Example did not start a TeaUI screen: ${url.href}`)
    }
    return program.terminal.output
  } finally {
    Screen.start = originalStart
    screen?.stop()
  }
}
