import type {Style} from './Style.js'

export interface Terminal {
  writeChar(char: string, x: number, y: number, style: Style): void
  restyleChar(x: number, y: number, style: Style): void
  writeMeta(str: string): void
  paintRect(
    style: Style,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
  ): void
}

export interface SGRTerminal {
  cols: number
  rows: number
  move(x: number, y: number): void
  write(str: string): void
  flush(): void
}
