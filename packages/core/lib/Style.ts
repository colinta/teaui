import {parseStyleDescriptor} from '@teaui/term'

import type {Color} from './Color.js'
import {colorToSGR} from './Color.js'
import {define} from './util.js'

type Nullable<T> = {[K in keyof T]?: null | undefined | T[K]}

export class Style {
  bold?: boolean
  dim?: boolean
  italic?: boolean
  strikeout?: boolean
  underline?: boolean
  inverse?: boolean
  blink?: boolean
  invisible?: boolean
  foreground?: Color
  background?: Color

  static NONE = new Style()
  static underlined = new Style({underline: true})
  static bold = new Style({bold: true})

  constructor({
    bold,
    dim,
    italic,
    strikeout,
    underline,
    inverse,
    blink,
    invisible,
    foreground,
    background,
  }: {
    underline?: boolean
    inverse?: boolean
    bold?: boolean
    dim?: boolean
    italic?: boolean
    strikeout?: boolean
    blink?: boolean
    invisible?: boolean
    foreground?: Color
    background?: Color
  } = {}) {
    this.underline = underline
    this.inverse = inverse
    this.bold = bold
    // bold and dim are mutually exclusive - bold has precedence
    this.dim = bold ? undefined : dim
    this.italic = italic
    this.strikeout = strikeout
    this.blink = blink
    this.invisible = invisible
    this.foreground = foreground
    this.background = background

    define(this, 'underline', {enumerable: this.underline !== undefined})
    define(this, 'inverse', {enumerable: this.inverse !== undefined})
    define(this, 'bold', {enumerable: this.bold !== undefined})
    define(this, 'dim', {enumerable: this.dim !== undefined})
    define(this, 'italic', {enumerable: this.italic !== undefined})
    define(this, 'strikeout', {enumerable: this.strikeout !== undefined})
    define(this, 'blink', {enumerable: this.blink !== undefined})
    define(this, 'invisible', {enumerable: this.invisible !== undefined})
    define(this, 'foreground', {enumerable: this.foreground !== undefined})
    define(this, 'background', {enumerable: this.background !== undefined})
  }

  invert(): Style {
    return this.merge({
      foreground: this.background,
      background: this.foreground,
    })
  }

  merge(style?: Nullable<Style>): Style {
    if (style === undefined) {
      return this
    }

    return new Style({
      underline: style.underline ?? this.underline,
      inverse: style.inverse ?? this.inverse,
      // only one of bold or dim
      bold: style.bold ?? (style.dim ? undefined : this.bold),
      dim: style.dim ?? (style.bold ? undefined : this.dim),
      italic: style.italic ?? this.italic,
      strikeout: style.strikeout ?? this.strikeout,
      blink: style.blink ?? this.blink,
      invisible: style.invisible ?? this.invisible,
      foreground:
        style.foreground === null
          ? undefined
          : style.foreground === undefined
            ? this.foreground
            : style.foreground,
      background:
        style.background === null
          ? undefined
          : style.background === undefined
            ? this.background
            : style.background,
    })
  }

  isEqual(style: Style) {
    return (
      this.underline === style.underline &&
      this.inverse === style.inverse &&
      this.bold === style.bold &&
      this.dim === style.dim &&
      this.italic === style.italic &&
      this.strikeout === style.strikeout &&
      this.blink === style.blink &&
      this.invisible === style.invisible &&
      this.foreground === style.foreground &&
      this.background === style.background
    )
  }

  /**
   * @return a more easily debuggable object
   */
  toDebug(): any {
    return (
      [
        ['bold', this.bold],
        ['dim', this.dim],
        ['italic', this.italic],
        ['strikeout', this.strikeout],
        ['underline', this.underline],
        ['inverse', this.inverse],
        ['blink', this.blink],
        ['invisible', this.invisible],
        ['foreground', this.foreground],
        ['background', this.background],
      ] as const
    )
      .filter(([name, value]) => value !== undefined)
      .reduce((o: any, [name, value]) => {
        o[name] = value
        return o
      }, {} as any)
  }

  static fromSGR(ansi: string, prevStyle: Style): Style {
    let match = ansi.match(/^\x1b\[([\d;]*)m$/)
    if (!match) {
      return Style.NONE
    }
    ansi = match[1] + ';'
    let ansiCodes: string[] = []
    let code = ''
    for (const char of ansi) {
      if (char === ';') {
        if (
          code === '38' ||
          code === '38;5' ||
          code === '48' ||
          code === '48;5' ||
          /^[34]8;2(;\d+){0,2}$/.test(code)
        ) {
          code += ';'
        } else {
          ansiCodes.push(code)
          code = ''
        }
      } else {
        code += char
      }
    }

    let styles: Partial<Style> = {}
    for (const code of ansiCodes) {
      if ((match = code.match(/^38;5;(\d+)$/))) {
        styles.foreground = {sgr: match[1]}
        continue
      } else if ((match = code.match(/^48;5;(\d+)$/))) {
        styles.background = {sgr: match[1]}
        continue
      } else if ((match = code.match(/^38;2;([\d;]+)$/))) {
        const [r, g, b] = match[1]
          .split(';')
          .map(i => Math.max(0, Math.min(255, parseInt(i, 10))))
        styles.foreground = [r, g, b]
        continue
      } else if ((match = code.match(/^48;2;([\d;]+)$/))) {
        const [r, g, b] = match[1]
          .split(';')
          .map(i => Math.max(0, Math.min(255, parseInt(i, 10))))
        styles.background = [r, g, b]
        continue
      }

      switch (code) {
        case '':
          break
        case '0':
          styles.foreground = prevStyle.foreground ?? 'default'
          styles.background = prevStyle.background ?? 'default'
          styles.bold = prevStyle.bold ?? false
          styles.dim = prevStyle.dim ?? false
          styles.italic = prevStyle.italic ?? false
          styles.underline = prevStyle.underline ?? false
          styles.blink = prevStyle.blink ?? false
          styles.inverse = prevStyle.inverse ?? false
          styles.invisible = prevStyle.invisible ?? false
          styles.strikeout = prevStyle.strikeout ?? false
          break
        case '1':
          styles.bold = true
          break
        case '2':
          styles.dim = true
          break
        case '22':
          styles.bold = prevStyle.bold ?? false
          styles.dim = prevStyle.dim ?? false
          break
        case '3':
          styles.italic = true
          break
        case '23':
          styles.italic = prevStyle.italic ?? false
          break
        case '4':
          styles.underline = true
          break
        case '24':
          styles.underline = prevStyle.underline ?? false
          break
        case '5':
          styles.blink = true
          break
        case '25':
          styles.blink = prevStyle.blink ?? false
          break
        case '7':
          styles.inverse = true
          break
        case '27':
          styles.inverse = prevStyle.inverse ?? false
          break
        case '8':
          styles.invisible = true
          break
        case '28':
          styles.invisible = prevStyle.invisible ?? false
          break
        case '9':
          styles.strikeout = true
          break
        case '29':
          styles.strikeout = prevStyle.strikeout ?? false
          break
        case '30':
          styles.foreground = 'black'
          break
        case '31':
          styles.foreground = 'red'
          break
        case '32':
          styles.foreground = 'green'
          break
        case '33':
          styles.foreground = 'yellow'
          break
        case '34':
          styles.foreground = 'blue'
          break
        case '35':
          styles.foreground = 'magenta'
          break
        case '36':
          styles.foreground = 'cyan'
          break
        case '37':
          styles.foreground = 'white'
          break
        case '39':
          styles.foreground = 'default'
          break
        case '90':
          styles.foreground = 'gray'
          break
        case '91':
          styles.foreground = 'brightRed'
          break
        case '92':
          styles.foreground = 'brightGreen'
          break
        case '93':
          styles.foreground = 'brightYellow'
          break
        case '94':
          styles.foreground = 'brightBlue'
          break
        case '95':
          styles.foreground = 'brightMagenta'
          break
        case '96':
          styles.foreground = 'brightCyan'
          break
        case '97':
          styles.foreground = 'brightWhite'
          break
        case '40':
          styles.background = 'black'
          break
        case '41':
          styles.background = 'red'
          break
        case '42':
          styles.background = 'green'
          break
        case '43':
          styles.background = 'yellow'
          break
        case '44':
          styles.background = 'blue'
          break
        case '45':
          styles.background = 'magenta'
          break
        case '46':
          styles.background = 'cyan'
          break
        case '47':
          styles.background = 'white'
          break
        case '49':
          styles.background = 'default'
          break
        case '100':
          styles.background = 'gray'
          break
        case '101':
          styles.background = 'brightRed'
          break
        case '102':
          styles.background = 'brightGreen'
          break
        case '103':
          styles.background = 'brightYellow'
          break
        case '104':
          styles.background = 'brightBlue'
          break
        case '105':
          styles.background = 'brightMagenta'
          break
        case '106':
          styles.background = 'brightCyan'
          break
        case '107':
          styles.background = 'brightWhite'
          break
      }
    }

    return new Style(styles)
  }

  /**
   * @param prevStyle Used by the buffer to reset foreground/background colors and attrs
   * @param text If provided, the text will be "wrapped" in the new codes, and
   * `prevStyle` will be restored.
   */
  toSGR(prevStyle: Style, text?: string): string {
    const parts: string[] = []
    const undo: string[] = []
    if (this.underline && !prevStyle.underline) {
      parts.push('underline')
      if (text) undo.push('!underline')
    } else if (!this.underline && prevStyle.underline) {
      parts.push('!underline')
      if (text) undo.push('underline')
    }

    if (this.bold && !prevStyle.bold) {
      parts.push('bold')
      if (text) undo.push('!bold')
    } else if (!this.bold && prevStyle.bold) {
      parts.push('!bold')
      if (text) undo.push('bold')
    }

    if (this.dim && !prevStyle.dim) {
      parts.push('dim')
      if (text) undo.push('!dim')
    } else if (!this.dim && prevStyle.dim) {
      parts.push('!dim')
      if (text) undo.push('dim')
    }

    if (this.italic && !prevStyle.italic) {
      parts.push('italic')
      if (text) undo.push('!italic')
    } else if (!this.italic && prevStyle.italic) {
      parts.push('!italic')
      if (text) undo.push('italic')
    }

    if (this.strikeout && !prevStyle.strikeout) {
      parts.push('strikeout')
      if (text) undo.push('!strikeout')
    } else if (!this.strikeout && prevStyle.strikeout) {
      parts.push('!strikeout')
      if (text) undo.push('strikeout')
    }

    if (this.inverse && !prevStyle.inverse) {
      parts.push('inverse')
      if (text) undo.push('!inverse')
    } else if (!this.inverse && prevStyle.inverse) {
      parts.push('!inverse')
      if (text) undo.push('inverse')
    }

    if (this.foreground) {
      parts.push(colorToSGR(this.foreground, 'fg'))
      if (text) undo.push(colorToSGR(prevStyle.foreground ?? 'default', 'fg'))
    } else if (prevStyle.foreground && prevStyle.foreground !== 'default') {
      parts.push(colorToSGR('default', 'fg'))
      if (text) undo.push(colorToSGR(prevStyle.foreground, 'fg'))
    }

    if (this.background) {
      parts.push(colorToSGR(this.background, 'bg'))
      if (text) undo.push(colorToSGR(prevStyle.background ?? 'default', 'bg'))
    } else if (prevStyle.background && prevStyle.background !== 'default') {
      parts.push(colorToSGR('default', 'bg'))
      if (text) undo.push(colorToSGR(prevStyle.background, 'bg'))
    }

    // put '!' flags in front
    parts.sort()
    undo.sort()

    if (text !== undefined) {
      return parseStyleDescriptor(parts) + text + parseStyleDescriptor(undo)
    }

    if (parts.length) {
      return parseStyleDescriptor(parts)
    } else {
      return ''
    }
  }
}
