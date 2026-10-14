import {setTimeout as delay} from 'node:timers/promises'
import {Screen} from '@teaui/core'
import {Subprocess} from '@teaui/subprocess'

const WIDTH = 40
const HEIGHT = 6
const OUTPUT_MARKER = 'one command, no shell'
const EXIT_MESSAGE = '[Process exited with code 0]'
const MAX_ATTEMPTS = 300
const POLL_INTERVAL = 10

// Node exits naturally after writing; no shell, interactive input, or network.
const CHILD_SCRIPT = `
process.stdout.write(
  '\\x1b[1;32mSubprocess in a PTY\\x1b[0m\\r\\n' +
  'message: ' + process.env.TEAUI_EXAMPLE_MESSAGE + '\\r\\n' +
  'one command, no shell\\r\\n'
)
`

let received = ''
let exitCode

const terminal = new Subprocess({
  command: process.execPath,
  args: ['--eval', CHILD_SCRIPT],
  env: {TEAUI_EXAMPLE_MESSAGE: 'hello from child'},
  width: WIDTH,
  height: HEIGHT,
  onData: data => {
    received += data
  },
  onExit: code => {
    exitCode = code
  },
})

const [screen] = await Screen.start(terminal)

try {
  let complete = false
  // onData precedes parsing; onExit alone does not guarantee painted output.
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    screen.render()
    if (terminal.processState === 'error') {
      throw new Error(screen.snapshot())
    }
    if (exitCode !== undefined && exitCode !== 0) {
      throw new Error(`Child exited with code ${exitCode}`)
    }
    const output = screen.snapshot()
    if (
      terminal.processState === 'exited' &&
      terminal.exitCode === 0 &&
      received.includes(OUTPUT_MARKER) &&
      output.includes(OUTPUT_MARKER) &&
      output.includes(EXIT_MESSAGE)
    ) {
      complete = true
      break
    }
    await delay(POLL_INTERVAL)
  }
  if (!complete) {
    throw new Error('Subprocess did not finish rendering before the deadline')
  }
} finally {
  // Detaches the view, kills any remaining PTY, and disposes xterm on failure too.
  screen.stop()
}
