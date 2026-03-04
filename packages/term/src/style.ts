import type { Color, TextAttribute } from './types.js'
import { fgColor, fgReset, bgColor, bgReset, textAttr, textAttrOff } from './ansi.js'

interface StyleEntry {
  open: string
  close: string
}

export class StyleBuilder {
  private readonly entries: readonly StyleEntry[]

  constructor(entries: readonly StyleEntry[] = []) {
    this.entries = entries
  }

  private add(open: string, close: string): StyleBuilder {
    return new StyleBuilder([...this.entries, { open, close }])
  }

  bold(): StyleBuilder {
    return this.add(textAttr('bold'), textAttrOff('bold'))
  }

  dim(): StyleBuilder {
    return this.add(textAttr('dim'), textAttrOff('dim'))
  }

  italic(): StyleBuilder {
    return this.add(textAttr('italic'), textAttrOff('italic'))
  }

  underline(): StyleBuilder {
    return this.add(textAttr('underline'), textAttrOff('underline'))
  }

  blink(): StyleBuilder {
    return this.add(textAttr('blink'), textAttrOff('blink'))
  }

  inverse(): StyleBuilder {
    return this.add(textAttr('inverse'), textAttrOff('inverse'))
  }

  hidden(): StyleBuilder {
    return this.add(textAttr('hidden'), textAttrOff('hidden'))
  }

  strikethrough(): StyleBuilder {
    return this.add(textAttr('strikethrough'), textAttrOff('strikethrough'))
  }

  fg(color: Color): StyleBuilder {
    return this.add(fgColor(color), fgReset())
  }

  bg(color: Color): StyleBuilder {
    return this.add(bgColor(color), bgReset())
  }

  open(): string {
    return this.entries.map((e) => e.open).join('')
  }

  close(): string {
    return [...this.entries]
      .reverse()
      .map((e) => e.close)
      .join('')
  }

  wrap(text: string): string {
    return this.open() + text + this.close()
  }
}
