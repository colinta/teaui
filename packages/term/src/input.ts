import type {
  InputEvent,
  KeyEvent,
  MouseEvent,
  MouseButton,
  MouseAction,
  PasteEvent,
  FocusEvent,
} from './types.js'

const ESC = 0x1b

function keyEvent(
  key: string,
  mods: { ctrl?: boolean; alt?: boolean; shift?: boolean; meta?: boolean } = {},
): KeyEvent {
  return {
    type: 'key',
    key,
    ctrl: mods.ctrl ?? false,
    alt: mods.alt ?? false,
    shift: mods.shift ?? false,
    meta: mods.meta ?? false,
  }
}

// Modifier decoding for CSI sequences: parameter = 1 + bitmask
// bit 0 = shift, bit 1 = alt, bit 2 = ctrl, bit 3 = meta
function decodeMods(param: number): {
  shift: boolean
  alt: boolean
  ctrl: boolean
  meta: boolean
} {
  const bits = param - 1
  return {
    shift: (bits & 1) !== 0,
    alt: (bits & 2) !== 0,
    ctrl: (bits & 4) !== 0,
    meta: (bits & 8) !== 0,
  }
}

const tildeKeyMap: Record<number, string> = {
  2: 'insert',
  3: 'delete',
  5: 'pageUp',
  6: 'pageDown',
  15: 'f5',
  17: 'f6',
  18: 'f7',
  19: 'f8',
  20: 'f9',
  21: 'f10',
  23: 'f11',
  24: 'f12',
}

const letterKeyMap: Record<string, string> = {
  A: 'up',
  B: 'down',
  C: 'right',
  D: 'left',
  H: 'home',
  F: 'end',
}

const ssFunctionKeys: Record<string, string> = {
  P: 'f1',
  Q: 'f2',
  R: 'f3',
  S: 'f4',
}

function parseSGRMouse(params: string, final: string): MouseEvent {
  const parts = params.split(';')
  const button = parseInt(parts[0], 10)
  const x = parseInt(parts[1], 10) - 1
  const y = parseInt(parts[2], 10) - 1

  const shift = (button & 4) !== 0
  const alt = (button & 8) !== 0
  const ctrl = (button & 16) !== 0
  const motion = (button & 32) !== 0
  const baseButton = button & 3

  let action: MouseAction
  let btn: MouseButton

  if (button & 64) {
    // scroll wheel: 0=up, 1=down, 2=left, 3=right
    action = (['scrollUp', 'scrollDown', 'scrollLeft', 'scrollRight'] as const)[baseButton]
    btn = 'none'
  } else if (motion) {
    // Motion events: baseButton encodes which button is held during motion.
    // baseButton 0=left, 1=middle, 2=right held down (drag)
    // baseButton 3 = no button held (pure mouse move)
    if (baseButton === 3) {
      action = 'move'
      btn = 'none'
    } else {
      action = 'drag'
      btn = (['left', 'middle', 'right', 'none'] as const)[baseButton]
    }
  } else if (final === 'm') {
    action = 'release'
    btn = (['left', 'middle', 'right', 'none'] as const)[baseButton]
  } else {
    action = 'press'
    btn = (['left', 'middle', 'right', 'none'] as const)[baseButton]
  }

  return {
    type: 'mouse',
    action,
    button: btn,
    x,
    y,
    ctrl,
    alt,
    shift,
  }
}

const PASTE_START = '\x1b[200~'
const PASTE_END = '\x1b[201~'

export function parseInput(data: Buffer): InputEvent[] {
  const events: InputEvent[] = []
  const str = data.toString('utf-8')
  let i = 0

  while (i < str.length) {
    // Bracketed paste
    if (str.startsWith(PASTE_START, i)) {
      const startIdx = i + PASTE_START.length
      const endIdx = str.indexOf(PASTE_END, startIdx)
      if (endIdx !== -1) {
        events.push({
          type: 'paste',
          text: str.slice(startIdx, endIdx),
        } satisfies PasteEvent)
        i = endIdx + PASTE_END.length
        continue
      }
    }

    if (str.charCodeAt(i) === ESC) {
      // Focus events: ESC [I (focus) / ESC [O (blur)
      if (i + 1 < str.length && str[i + 1] === '[') {
        if (i + 2 < str.length && str[i + 2] === 'I') {
          events.push({ type: 'focus', focused: true } satisfies FocusEvent)
          i += 3
          continue
        }
        if (i + 2 < str.length && str[i + 2] === 'O') {
          events.push({ type: 'focus', focused: false } satisfies FocusEvent)
          i += 3
          continue
        }
      }

      // Check for CSI (ESC [)
      if (i + 1 < str.length && str[i + 1] === '[') {
        i += 2
        // Collect params and find final byte
        let params = ''
        while (i < str.length && str[i] >= '0' && str[i] <= '?') {
          params += str[i]
          i++
        }
        if (i < str.length) {
          const final = str[i]
          i++

          // SGR mouse: < params M/m
          if (params.startsWith('<') && (final === 'M' || final === 'm')) {
            events.push(parseSGRMouse(params.slice(1), final))
            continue
          }

          // Tilde sequences: number ~ or number;modifier ~
          if (final === '~') {
            const tildeParts = params.split(';')
            const num = parseInt(tildeParts[0], 10)
            const name = tildeKeyMap[num]
            if (name) {
              const mods = tildeParts.length > 1
                ? decodeMods(parseInt(tildeParts[1], 10))
                : {}
              events.push(keyEvent(name, mods))
              continue
            }
          }

          // Backtab (shift+tab): CSI Z
          if (final === 'Z' && params === '') {
            events.push(keyEvent('tab', { shift: true }))
            continue
          }

          // Modified function keys: CSI 1;mod P/Q/R/S (Shift/Ctrl/Alt + F1-F4)
          if (ssFunctionKeys[final] && params && params.includes(';')) {
            const modParts = params.split(';')
            const mod = parseInt(modParts[1], 10)
            events.push(keyEvent(ssFunctionKeys[final], decodeMods(mod)))
            continue
          }

          // Letter key (arrow, home, end) possibly with modifier
          if (letterKeyMap[final]) {
            const name = letterKeyMap[final]
            if (params && params.includes(';')) {
              const modParts = params.split(';')
              const mod = parseInt(modParts[1], 10)
              events.push(keyEvent(name, decodeMods(mod)))
            } else {
              events.push(keyEvent(name))
            }
            continue
          }
        }
        // Unknown CSI sequence — skip
        continue
      }

      // SS3 (ESC O) — F1-F4
      if (i + 1 < str.length && str[i + 1] === 'O') {
        if (i + 2 < str.length && ssFunctionKeys[str[i + 2]]) {
          events.push(keyEvent(ssFunctionKeys[str[i + 2]]))
          i += 3
          continue
        }
      }

      // Alt + Ctrl+char (ESC followed by control character)
      if (i + 1 < str.length) {
        const nextCode = str.charCodeAt(i + 1)
        if (nextCode < 0x20 && nextCode !== ESC) {
          // Ctrl+Alt combination: ESC followed by a control character
          if (nextCode === 0x0d || nextCode === 0x0a) {
            events.push(keyEvent('return', { alt: true }))
          } else if (nextCode === 0x09) {
            events.push(keyEvent('tab', { alt: true }))
          } else {
            const letter = String.fromCharCode(nextCode + 0x60)
            events.push(keyEvent(letter, { ctrl: true, alt: true }))
          }
          i += 2
          continue
        }
      }

      // Alt + char (ESC followed by printable)
      if (i + 1 < str.length && str.charCodeAt(i + 1) >= 0x20) {
        const altCodePoint = str.codePointAt(i + 1)!
        const altChar = String.fromCodePoint(altCodePoint)
        events.push(keyEvent(altChar, { alt: true }))
        i += 1 + altChar.length
        continue
      }

      // Standalone ESC
      events.push(keyEvent('escape'))
      i++
      continue
    }

    const code = str.charCodeAt(i)

    // Control characters
    if (code < 0x20) {
      if (code === 0x0d) {
        events.push(keyEvent('return'))
      } else if (code === 0x0a) {
        events.push(keyEvent('return'))
      } else if (code === 0x09) {
        events.push(keyEvent('tab'))
      } else {
        // Ctrl+A = 1, Ctrl+Z = 26
        const letter = String.fromCharCode(code + 0x60)
        events.push(keyEvent(letter, { ctrl: true }))
      }
      i++
      continue
    }

    // Backspace / DEL
    if (code === 0x7f) {
      events.push(keyEvent('backspace'))
      i++
      continue
    }

    // Space
    if (code === 0x20) {
      events.push(keyEvent('space'))
      i++
      continue
    }

    // Regular printable character (may be multi-code-unit, e.g. emoji)
    const codePoint = str.codePointAt(i)!
    const char = String.fromCodePoint(codePoint)
    events.push(keyEvent(char))
    i += char.length
  }

  return events
}

// --- InputReader: attaches to a readable stream ---

export class InputReader {
  private listeners: Array<(event: InputEvent) => void> = []
  private dataHandler: ((data: Buffer) => void) | null = null
  private stream: NodeJS.ReadableStream | null = null

  attach(stream: NodeJS.ReadableStream): void {
    this.stream = stream
    this.dataHandler = (data: Buffer) => {
      const events = parseInput(data)
      for (const event of events) {
        for (const listener of this.listeners) {
          listener(event)
        }
      }
    }
    stream.on('data', this.dataHandler)
  }

  detach(): void {
    if (this.stream && this.dataHandler) {
      this.stream.removeListener('data', this.dataHandler)
      this.dataHandler = null
      this.stream = null
    }
  }

  onInput(cb: (event: InputEvent) => void): () => void {
    this.listeners.push(cb)
    return () => {
      const idx = this.listeners.indexOf(cb)
      if (idx !== -1) this.listeners.splice(idx, 1)
    }
  }
}
