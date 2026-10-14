import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 40
const HEIGHT = 6

export const subprocessExample: ComponentExample = {
  name: 'subprocess',
  availability: 'both',
  description:
    'Embed a child terminal with @teaui/subprocess (React: @teaui/subprocess/react). Requires native node-pty and @xterm/headless. Spawns on mount, forwards keyboard/mouse input when focused, resizes with the viewport, and kills/disposes on unmount. The short-lived Node sample waits for exit and parsed output before cleanup; the final buffer includes an exit-code overlay. Command options and callbacks are construction-time only, not live React updates',
  props: [
    {
      name: 'command',
      type: 'string',
      description:
        'Required executable to spawn directly in a PTY, not a shell command line. The sample uses process.execPath so no shell or external program is needed',
      availability: 'both',
    },
    {
      name: 'args',
      type: 'string[]',
      description:
        'Defaults to []; arguments passed to the executable. The sample uses --eval with a deterministic script that prints three lines and exits naturally',
      availability: 'both',
    },
    {
      name: 'env',
      type: 'Record<string, string>',
      description:
        'Defaults to {}; merged over process.env and TERM=xterm-256color. The sample supplies TEAUI_EXAMPLE_MESSAGE without displaying machine-specific environment values',
      availability: 'both',
    },
    {
      name: 'cwd',
      type: 'string',
      description:
        'Optional working directory passed to the PTY; undefined by default',
      availability: 'both',
    },
    {
      name: 'onData',
      type: '(data: string) => void',
      description:
        'Optional callback for raw PTY output, including ANSI escapes; chunks need not match lines. Runs before xterm parses the data, so this alone does not mean the buffer is ready to render',
      availability: 'both',
    },
    {
      name: 'onExit',
      type: '(exitCode: number, signal?: number) => void',
      description:
        'Optional callback when the child exits. The final terminal buffer is preserved with an exit-code overlay; pending output parsing may finish after this callback. Spawn failures display Error: instead of invoking onExit',
      availability: 'both',
    },
    {
      name: 'onFocus',
      type: '() => void',
      description: 'Optional callback when the view receives focus',
      availability: 'both',
    },
    {
      name: 'onBlur',
      type: '() => void',
      description: 'Optional callback when the view loses focus',
      availability: 'both',
    },
    {
      name: 'width',
      type: "number | 'fill' | 'shrink' | 'natural'",
      description:
        "Defaults to 'fill'; width in terminal columns. Natural size consumes the available width; nonempty viewport changes resize xterm and the running PTY",
      availability: 'both',
    },
    {
      name: 'height',
      type: "number | 'fill' | 'shrink' | 'natural'",
      description:
        "Defaults to 'fill'; height in terminal rows. Natural size consumes the available height; the sample reserves the last row for the exit overlay",
      availability: 'both',
    },
    {
      name: 'processState',
      type: "'idle' | 'starting' | 'running' | 'exited' | 'error'",
      description:
        'Core read-only property, not a constructor prop: current lifecycle state. The React wrapper exposes neither this property nor a ref',
      availability: 'core',
    },
    {
      name: 'exitCode',
      type: 'number | null',
      description:
        "Core read-only property, not a constructor prop: exit code when processState is 'exited', otherwise null",
      availability: 'core',
    },
  ],
  source: {
    core: () => readExampleSource('subprocess.core.js'),
    react: () => readExampleSource('subprocess.react.tsx'),
  },
  render: {
    core: () => renderSample('subprocess.core.js'),
    react: () => renderSample('subprocess.react.tsx'),
  },
}

function readExampleSource(filename: string): string {
  return readFileSync(
    new URL(`./${filename}`, import.meta.url),
    'utf8',
  ).trimEnd()
}

function renderSample(filename: string): Promise<string> {
  return captureExample(new URL(`./${filename}`, import.meta.url), {
    width: WIDTH,
    height: HEIGHT,
  })
}
