const RESET = '\x1b[0m'

function ansi(code: number, input: string): string {
  const opener = '\x1b['.concat(String(code), 'm')
  return opener.concat(input.replace(RESET, opener), RESET)
}

export function bold(input: string): string {
  return ansi(1, input)
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

export function cyan(input: string): string {
  return ansi(36, input)
}

export function gray(input: string): string {
  return ansi(90, input)
}
