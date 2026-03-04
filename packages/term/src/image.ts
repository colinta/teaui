import type { ImageOptions, ImageProtocol } from './types.js'
import { OSC, ST, ESC } from './ansi.js'

const KITTY_CHUNK_SIZE = 4096

export function itermImage(data: Buffer, options: ImageOptions = {}): string {
  const b64 = data.toString('base64')
  const params: string[] = ['inline=1']

  if (options.width !== undefined) params.push(`width=${options.width}`)
  if (options.height !== undefined) params.push(`height=${options.height}`)
  if (options.preserveAspectRatio === false)
    params.push('preserveAspectRatio=0')

  return `${OSC}1337;File=${params.join(';')}:${b64}${ST}`
}

export function kittyImage(data: Buffer, options: ImageOptions = {}): string {
  const b64 = data.toString('base64')
  const chunks: string[] = []

  // Build base params
  const baseParams: string[] = ['a=T', 'f=100']
  if (options.width !== undefined) baseParams.push(`c=${options.width}`)
  if (options.height !== undefined) baseParams.push(`r=${options.height}`)

  if (b64.length <= KITTY_CHUNK_SIZE) {
    return `${ESC}_G${baseParams.join(',')},m=0;${b64}${ST}`
  }

  // Multiple chunks
  for (let i = 0; i < b64.length; i += KITTY_CHUNK_SIZE) {
    const chunk = b64.slice(i, i + KITTY_CHUNK_SIZE)
    const isLast = i + KITTY_CHUNK_SIZE >= b64.length
    const more = isLast ? 0 : 1

    if (i === 0) {
      chunks.push(`${ESC}_G${baseParams.join(',')},m=${more};${chunk}${ST}`)
    } else {
      chunks.push(`${ESC}_Gm=${more};${chunk}${ST}`)
    }
  }

  return chunks.join('')
}

export function detectImageProtocol(
  env: Record<string, string | undefined> = process.env,
): ImageProtocol {
  const termProgram = env.TERM_PROGRAM?.toLowerCase() ?? ''
  const term = env.TERM?.toLowerCase() ?? ''

  if (termProgram === 'kitty' || term === 'xterm-kitty') return 'kitty'
  if (termProgram === 'iterm.app' || termProgram === 'wezterm') return 'iterm'

  return 'none'
}
