import type { CursorShape } from './types.js'
import * as ansi from './ansi.js'

export class CursorController {
  private write: (s: string) => void

  constructor(write: (s: string) => void) {
    this.write = write
  }

  moveTo(x: number, y: number): this {
    this.write(ansi.cursorTo(x, y))
    return this
  }

  moveBy(dx: number, dy: number): this {
    this.write(ansi.cursorMove(dx, dy))
    return this
  }

  up(n = 1): this {
    this.write(ansi.cursorUp(n))
    return this
  }

  down(n = 1): this {
    this.write(ansi.cursorDown(n))
    return this
  }

  forward(n = 1): this {
    this.write(ansi.cursorForward(n))
    return this
  }

  back(n = 1): this {
    this.write(ansi.cursorBack(n))
    return this
  }

  nextLine(n = 1): this {
    this.write(ansi.cursorNextLine(n))
    return this
  }

  prevLine(n = 1): this {
    this.write(ansi.cursorPrevLine(n))
    return this
  }

  column(x: number): this {
    this.write(ansi.cursorColumn(x))
    return this
  }

  save(): this {
    this.write(ansi.cursorSave())
    return this
  }

  restore(): this {
    this.write(ansi.cursorRestore())
    return this
  }

  show(): this {
    this.write(ansi.cursorShow())
    return this
  }

  hide(): this {
    this.write(ansi.cursorHide())
    return this
  }

  shape(s: CursorShape): this {
    this.write(ansi.cursorShape(s))
    return this
  }
}
