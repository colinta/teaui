export type TerminalResponseMatch<T> =
  | {status: 'none'}
  | {status: 'partial'}
  | {status: 'match'; length: number; value: T}

/**
 * Examines bytes beginning at a possible terminal response. Matchers must
 * return `partial` only when every byte could still belong to the response.
 */
export type TerminalResponseMatcher<T> = (
  candidate: Buffer,
) => TerminalResponseMatch<T>

export interface TerminalResponseRouteOptions {
  /** Remove the route after its first response. */
  once?: boolean
}

interface ResponseRoute {
  matcher: TerminalResponseMatcher<unknown>
  listener: (value: unknown, raw: Buffer) => void
  once: boolean
}

/**
 * Incrementally separates requested terminal responses from ordinary input.
 * Bytes not claimed by a response matcher are forwarded unchanged and in
 * order, so the normal keyboard and mouse parser can consume them.
 */
export class TerminalResponseRouter {
  private routes: ResponseRoute[] = []
  private pending = Buffer.alloc(0)
  private draining = false
  private readonly maxPendingBytes: number

  constructor(
    private readonly forward: (data: Buffer) => void,
    {maxPendingBytes = 4096}: {maxPendingBytes?: number} = {},
  ) {
    if (!Number.isInteger(maxPendingBytes) || maxPendingBytes <= 0) {
      throw new RangeError('maxPendingBytes must be a positive integer')
    }
    this.maxPendingBytes = maxPendingBytes
  }

  push(data: Buffer): void {
    if (data.length === 0) return

    if (this.routes.length === 0 && this.pending.length === 0) {
      this.forward(data)
      return
    }

    this.pending =
      this.pending.length === 0
        ? data
        : Buffer.concat([this.pending, data], this.pending.length + data.length)
    this.drain()
  }

  onResponse<T>(
    matcher: TerminalResponseMatcher<T>,
    listener: (value: T, raw: Buffer) => void,
    {once = false}: TerminalResponseRouteOptions = {},
  ): () => void {
    const route: ResponseRoute = {
      matcher,
      listener: (value, raw) => listener(value as T, raw),
      once,
    }
    this.routes.push(route)

    return () => {
      const index = this.routes.indexOf(route)
      if (index === -1) return
      this.routes.splice(index, 1)
      this.drain()
    }
  }

  /** Forward any candidate bytes currently waiting for another chunk. */
  flush(): void {
    if (this.pending.length === 0) return
    const pending = this.pending
    this.pending = Buffer.alloc(0)
    this.forward(pending)
  }

  private drain(): void {
    if (this.draining || this.pending.length === 0) return
    this.draining = true

    const unmatched: Buffer[] = []
    const forwardUnmatched = () => {
      if (unmatched.length === 0) return
      this.forward(
        unmatched.length === 1 ? unmatched[0] : Buffer.concat(unmatched),
      )
      unmatched.length = 0
    }

    try {
      while (this.pending.length > 0) {
        let hasPartialMatch = false
        let matchedRoute: ResponseRoute | undefined
        let matchedResult:
          | {status: 'match'; length: number; value: unknown}
          | undefined

        for (const route of this.routes) {
          const result = route.matcher(this.pending)
          if (result.status === 'match') {
            matchedRoute = route
            matchedResult = result
            break
          }
          if (result.status === 'partial') hasPartialMatch = true
        }

        if (matchedRoute && matchedResult) {
          if (
            !Number.isInteger(matchedResult.length) ||
            matchedResult.length <= 0 ||
            matchedResult.length > this.pending.length
          ) {
            throw new RangeError(
              'Terminal response match length must identify available bytes',
            )
          }

          forwardUnmatched()
          const raw = this.pending.subarray(0, matchedResult.length)
          this.pending = this.pending.subarray(matchedResult.length)
          if (matchedRoute.once) {
            const index = this.routes.indexOf(matchedRoute)
            if (index !== -1) this.routes.splice(index, 1)
          }
          matchedRoute.listener(matchedResult.value, raw)
          continue
        }

        if (hasPartialMatch) {
          if (this.pending.length <= this.maxPendingBytes) break
          unmatched.push(this.pending)
          this.pending = Buffer.alloc(0)
          break
        }

        unmatched.push(this.pending.subarray(0, 1))
        this.pending = this.pending.subarray(1)
      }

      forwardUnmatched()
    } finally {
      this.draining = false
    }
  }
}
