import {highlight as _highlight, DEFAULT_THEME} from 'cli-highlight'
import type {Theme} from 'cli-highlight'

/**
 * Build a theme that always emits ANSI codes regardless of TTY/chalk color level.
 * cli-highlight uses chalk instances which auto-disable in non-TTY environments.
 * We extract the raw ANSI open/close codes from chalk's internal styler and
 * build plain string-wrapping functions.
 */
function buildAnsiTheme(): Theme {
  const theme: Record<string, (text: string) => string> = {}

  for (const [key, value] of Object.entries(DEFAULT_THEME)) {
    if (typeof value === 'function' && (value as any)._styler) {
      const {open, close} = (value as any)._styler
      theme[key] = (text: string) => `${open}${text}${close}`
    } else if (typeof value === 'function') {
      theme[key] = value as (text: string) => string
    }
  }

  return theme as Theme
}

const ANSI_THEME = buildAnsiTheme()

/**
 * Syntax highlight with ANSI codes always enabled (regardless of TTY).
 */
export function highlight(
  code: string,
  options?: {language?: string; ignoreIllegals?: boolean},
): string {
  return _highlight(code, {...options, theme: ANSI_THEME})
}
