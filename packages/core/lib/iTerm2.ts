import type {Color} from './Color.js'
import {colorToHex} from './Color.js'

interface WritableProgram {
  write(str: string): void
  once(event: string, fn: (...args: any[]) => void): void
}

/**
 * Sets iTerm2 proprietary ANSI codes
 */
export class iTerm2 {
  static _restoreBg: string | undefined

  /**
   * Returns a promise in case you really want to do flow control here, but it's not
   * necessary; you can fire and forget this as part of `Screen.start()`
   *
   * @example
   * Screen.start(async (program) => {
   *   await iTerm2.setBackground(program, [23, 23, 23])
   *   return new Box({ … })
   * })
   */
  static setBackground(program: WritableProgram, bg: Color): Promise<void> {
    process.on('exit', () => {
      iTerm2.restoreBg(program)
    })

    return new Promise(resolve => {
      const hex = colorToHex(bg).slice(1)

      program.once('data', (input: any) => {
        const response =
          typeof input === 'string' ? input : new TextDecoder().decode(input)
        iTerm2._restoreBg = parseBackgroundResponse(response)

        program.write(setBackgroundCommand(hex))
        setTimeout(resolve, 5)
      })

      setTimeout(resolve, 10)

      program.write(getBackgroundColorCommand())
    })
  }

  static restoreBg(program: WritableProgram) {
    if (iTerm2._restoreBg) {
      program.write(setBackgroundCommand(iTerm2._restoreBg))
    }
  }
}

function getBackgroundColorCommand() {
  return '\x1b]4;-2;?\x07'
}

function parseBackgroundResponse(response: string): string | undefined {
  const match = response.match(/\x1b\]4;-2;rgb:(\w{2})\w*\/(\w{2})\w*\/(\w{2})/)
  if (match) {
    return match[1] + match[2] + match[3]
  }
}

/**
 * @param rgb should not include the '#' symbol
 */
function setBackgroundCommand(rgb: string): string {
  return `\x1b]Ph${rgb.replace('#', '')}\x1b\\`
}
