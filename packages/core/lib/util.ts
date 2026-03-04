import * as unicode from '@teaui/term'

let _debug = false
/**
 * A global function to turn debugging on/off, useful to test things that would
 * otherwise output way too much, ie console in render()
 */
export function debug(value?: boolean): boolean {
  return (_debug = value ?? _debug)
}

/**
 * Left pads (with spaces) according to terminal width
 */
export function leftPad(str: string, length: number): string {
  const lines = str.split('\n')
  if (lines.length > 1) {
    return lines.map(line => leftPad(line, length)).join('\n')
  }
  const width = unicode.lineWidth(str)
  if (width >= length) {
    return str
  }

  return ' '.repeat(length - width).concat(str)
}

/**
 * Right pads (with spaces) according to terminal width
 */
export function rightPad(str: string, length: number): string {
  const lines = str.split('\n')
  if (lines.length > 1) {
    return lines.map(line => rightPad(line, length)).join('\n')
  }
  const width = unicode.lineWidth(str)
  if (width >= length) {
    return str
  }

  return str.concat(' '.repeat(length - width))
}

/**
 * Center pads (with spaces) according to terminal width
 */
export function centerPad(str: string, length: number): string {
  const lines = str.split('\n')
  if (lines.length > 1) {
    return lines.map(line => centerPad(line, length)).join('\n')
  }
  const width = unicode.lineWidth(str)
  if (width >= length) {
    return str
  }

  const left = ' '.repeat(~~((length - width) / 2))
  const right = ' '.repeat(~~((length - width) / 2 + 0.5))
  return left.concat(str, right)
}

/**
 * Used to add {enumerable: true} to defined properties on Components, so they
 * are picked up by inspect().
 */
export function define<T extends object>(
  object: T,
  property: keyof T,
  attributes: PropertyDescriptor,
) {
  let kls = object
  do {
    const descriptor = Object.getOwnPropertyDescriptor(kls, property)
    if (descriptor) {
      const modified_descriptor = Object.assign(descriptor, attributes)
      Object.defineProperty(object, property, modified_descriptor)
      return
    } else {
      kls = Object.getPrototypeOf(kls)
    }
  } while (kls && kls !== Object.prototype)
}

function isStringArray(
  input: string | string[] | [string, number][],
): input is string[] {
  return input.length > 0 && typeof input[0] === 'string'
}

function isStringAndWidthArray(
  input: string | string[] | [string, number][],
): input is string[] {
  return input.length > 0 && Array.isArray(input[0])
}

/**
 * Wraps lines to fit within contentWidth. Lots to solve for here.
 * 1. Word wrapping is accomplished using unicode.words
 * 2. ANSI codes are restored by scanning the segments, inserting the ANSI back where it belongs
 */
export function wrap(
  input: string | string[] | [string, number][],
  contentWidth: number,
): [string, number][] {
  if (contentWidth === 0) {
    return []
  }

  let lines: [string, number][]
  if (typeof input === 'string') {
    lines = input
      .split('\n')
      .map(line => [line, unicode.lineWidth(line)] as const)
  } else if (isStringArray(input)) {
    lines = input.map(line => [line, unicode.lineWidth(line)] as const)
  } else if (isStringAndWidthArray(input)) {
    lines = input
  } else {
    return []
  }

  return lines.flatMap(([line, width]): [string, number][] => {
    if (width <= contentWidth) {
      return [[line, width]]
    }

    const outputLines: [string, number][] = []
    function pushTrimmed(line: string, width: number) {
      const trimmed = line.replace(/\s+$/, '')
      const trimmedWidth = width - (line.length - trimmed.length)
      outputLines.push([trimmed, trimmedWidth])
    }

    let currentChars: string[] = []
    let currentWidth = 0
    const STOP: string[] = []
    const words = unicode.words(line).concat([[STOP, 0]] as const)
    for (const [wordChars] of words) {
      let wordWidth = unicode.lineWidth(wordChars)
      if (
        (!currentWidth || currentWidth + wordWidth <= contentWidth) &&
        wordChars !== STOP
      ) {
        // 1) there's enough room on the line (and it's not the sentinel STOP)
        // or the line is empty, in which case it must have at least _one_ word.
        // it's possible that this will add a word _longer_ than contentWidth.
        // that's ok, it will get picked up below (on the next word, or by STOP)
        currentChars.push(...wordChars)
        currentWidth += wordWidth
      } else {
        // 2) there wasn't enough room on the line – or we are at the STOP sentinel.
        if (currentWidth <= contentWidth) {
          // 3) if currentChars fits, push it to the buffer and reset currentChars
          //    if wordChars has content it didn't fit on the current line. It will
          //    be picked up below
          pushTrimmed(currentChars.join(''), currentWidth)
          currentChars = []
          currentWidth = 0
        } else {
          // 4) currentChars is longer than contentWidth. Add characters one at a time
          //    until >contentWidth. The remaining characters can stay in currentChars.
          //    If we are at the end (STOP), add
          do {
            let buffer = '',
              bufferWidth = 0,
              index = 0
            for (let char of currentChars) {
              const charWidth = unicode.charWidth(char)
              if (bufferWidth && bufferWidth + charWidth > contentWidth) {
                pushTrimmed(buffer, bufferWidth)

                // Some delicate math here; remove the bufferWidth from currentWidth, and then
                // scan past whitespace, removing that width, too. (Avoids an expensive call to
                // unicode.lineWidth())
                currentWidth -= bufferWidth
                while (currentChars[index]?.match(/^\s+$/)) {
                  currentWidth -= unicode.charWidth(currentChars[index])
                  index += 1
                }

                currentChars = currentChars.slice(index)
                index = 0
                if (currentWidth > contentWidth) {
                  // if remaining width is still longer than contentWidth, reset bufferWidth and
                  // continue
                  buffer = ''
                  bufferWidth = 0
                } else {
                  // either we have more words, or we are at STOP but we have enough room for
                  // currentChars in contentWidth
                  break
                }
              }

              buffer += char
              bufferWidth += charWidth
              index += 1
            }
          } while (currentWidth > contentWidth)
        }

        if (wordChars === STOP && currentChars.length) {
          pushTrimmed(currentChars.join(''), currentWidth)
        } else if (wordChars.length) {
          // until now, we've only processed the _previous_ currentChars buffer, and it
          // needed to be wrapped to contentWidth. If any remains in currentChars, it
          // starts with a printable character (we skipped whitespace when buffer was
          // full).
          // If it's empty, we should skip the preceding whitespace in wordChars.
          if (currentChars.length === 0) {
            while (wordChars.length && wordChars[0].match(/^\s+$/)) {
              const char = wordChars.shift()!
              wordWidth -= unicode.charWidth(char)
            }
          }
          currentChars.push(...wordChars)
          currentWidth += wordWidth
        }
      }
    }

    return outputLines
  })
}
