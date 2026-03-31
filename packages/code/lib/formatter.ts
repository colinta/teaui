import {highlight} from './highlight.js'

/**
 * Creates a formatting function suitable for use with Input's `format` prop.
 * Returns a function that takes plain text and returns ANSI-colored text
 * with syntax highlighting applied.
 *
 * @param language - Language for highlighting (auto-detected if omitted)
 *
 * @example
 * ```ts
 * import {Input} from '@teaui/core'
 * import {codeHighlighter} from '@teaui/code'
 *
 * new Input({
 *   multiline: true,
 *   format: codeHighlighter('javascript'),
 * })
 * ```
 */
export function codeHighlighter(language?: string): (text: string) => string {
  return (text: string): string => {
    try {
      return highlight(text, {
        language,
        ignoreIllegals: true,
      })
    } catch {
      return text
    }
  }
}
