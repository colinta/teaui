import {parseStyleDescriptor, BG_DRAW as _BG_DRAW} from '@teaui/term'

export const RESET = '\x1b[0m'

// unicode.charWidth considers this "drawable" (width: 1). Buffer translates it
// to a space when it flushes to a terminal. It's used by Viewport.paint to
// put foreground/background colors into a region – subsequent draws that do
// _not_ specify foreground/background (value: undefined) will "inherit" this
// "paint" color.
export const BG_DRAW = _BG_DRAW

export function styled(input: string, attr: string): string {
  const open = parseStyleDescriptor(attr)
  const close = parseStyleDescriptor('!' + attr)
  return open + input + close
}

export function style(attr: string): string {
  if (attr.startsWith('\x1b[')) {
    return attr
  }
  return parseStyleDescriptor(attr)
}

export function ansi(code: number, input: string): string {
  const opener = '\x1b['.concat(String(code), 'm')
  return opener.concat(input.replace(RESET, opener), RESET)
}

export function bold(input: string): string {
  return ansi(1, input)
}

export function dim(input: string): string {
  return ansi(2, input)
}

export function italic(input: string): string {
  return ansi(3, input)
}

export function underline(input: string): string {
  return ansi(4, input)
}

export function invert(input: string): string {
  return ansi(7, input)
}

export function hide(input: string): string {
  return ansi(8, input)
}

export function strikeout(input: string): string {
  return ansi(9, input)
}

export function red(input: string): string {
  return ansi(31, input)
}

export function green(input: string): string {
  return ansi(32, input)
}

export function yellow(input: string): string {
  return ansi(33, input)
}

export function blue(input: string): string {
  return ansi(34, input)
}

export function magenta(input: string) {
  return ansi(35, input)
}

export function cyan(input: string): string {
  return ansi(36, input)
}

export function gray(input: string): string {
  return ansi(90, input)
}
