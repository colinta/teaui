import {readFileSync} from 'node:fs'
import {flushLogs} from '@teaui/core'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 36
const HEIGHT = 5

export const consoleLogExample: ComponentExample = {
  name: 'console-log',
  availability: 'both',
  description:
    'Display console.log/info/warn/error calls after interceptConsoleLog(); debug calls are not displayed',
  props: [
    {
      name: 'width',
      type: 'Dimension',
      description: "Columns or 'fill', 'shrink', 'natural'",
      availability: 'both',
    },
    {
      name: 'height',
      type: 'Dimension',
      description: "Rows or 'fill', 'shrink', 'natural'",
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<ConsoleLog>',
      description: 'Reference to the underlying Core ConsoleLog',
      availability: 'react',
    },
  ],
  source: {
    react: () => readExampleSource('console-log.react.tsx'),
    core: () => readExampleSource('console-log.core.js'),
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
  return renderSample('console-log.react.tsx')
}

function renderCore(): Promise<string> {
  return renderSample('console-log.core.js')
}

async function renderSample(filename: string): Promise<string> {
  const consoleMethods = CONSOLE_LEVELS.map(level => console[level])
  const exitListeners = new Set(process.listeners('exit'))

  try {
    return await captureExample(new URL(`./${filename}`, import.meta.url), {
      width: WIDTH,
      height: HEIGHT,
    })
  } finally {
    try {
      // The capture stops the screen; flush any entries left by a failed start.
      flushLogs()
    } finally {
      // Interception installs an exit listener and restores built-in console
      // methods on flush. Preserve the caller's methods (including test spies).
      for (const listener of process.listeners('exit')) {
        if (!exitListeners.has(listener)) {
          process.removeListener('exit', listener)
        }
      }
      CONSOLE_LEVELS.forEach((level, index) => {
        console[level] = consoleMethods[index]
      })
    }
  }
}

const CONSOLE_LEVELS = ['debug', 'error', 'info', 'log', 'warn'] as const
