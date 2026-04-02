import {TerminalProgram} from '@teaui/core'

const program = new TerminalProgram()
program.teardown()
setTimeout(() => {
  process.exit(0)
}, 0)
