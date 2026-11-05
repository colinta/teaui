import type {TerminalEnv, TerminalInput, TerminalOutput} from './types.js'

// Host access that works without Node globals (e.g. in a browser). Nothing in
// @teaui/term should reference `process` or `Buffer` directly.

interface NodeLikeProcess {
  env?: TerminalEnv
  stdout?: TerminalOutput
  stdin?: TerminalInput
}

function hostProcess(): NodeLikeProcess | undefined {
  return (globalThis as {process?: NodeLikeProcess}).process
}

/** `process.env`, or an empty environment when there is no process. */
export function defaultEnv(): TerminalEnv {
  return hostProcess()?.env ?? {}
}

export function defaultStdout(): TerminalOutput | undefined {
  return hostProcess()?.stdout
}

export function defaultStdin(): TerminalInput | undefined {
  return hostProcess()?.stdin
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export const EMPTY_BYTES = new Uint8Array(0)

export function encodeUtf8(str: string): Uint8Array {
  return encoder.encode(str)
}

export function decodeUtf8(
  bytes: Uint8Array,
  start = 0,
  end = bytes.length,
): string {
  return decoder.decode(bytes.subarray(start, end))
}

/** Normalize stream data (string or bytes) to bytes. */
export function toBytes(data: string | Uint8Array): Uint8Array {
  return typeof data === 'string' ? encodeUtf8(data) : data
}

export function concatBytes(chunks: readonly Uint8Array[]): Uint8Array {
  if (chunks.length === 1) {
    return chunks[0]
  }
  let length = 0
  for (const chunk of chunks) {
    length += chunk.length
  }
  const result = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return result
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += BASE64_CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + BASE64_CHUNK))
  }
  return btoa(binary)
}

const BASE64_CHUNK = 0x8000
