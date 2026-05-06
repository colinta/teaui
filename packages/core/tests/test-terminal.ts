import type {SGRTerminal} from '../lib/terminal.js'

export class TestTerminal implements SGRTerminal {
  chars = ''
  move(x: number, y: number) {
    this.x = x
    this.y = y
  }
  write(str: string) {
    console.info(`x: ${this.x}, y: ${this.y}: ${str}`)
  }
  flush() {}

  cols: number = 5
  rows: number = 1
  x: number = 0
  y: number = 0
}
