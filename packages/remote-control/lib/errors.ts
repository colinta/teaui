type RequestErrorDetail =
  | {readonly type: 'invalid-json'}
  | {
      readonly type: 'invalid-event'
      readonly reason: 'shape' | 'snapshot-format'
    }
  | {readonly type: 'binary-message'}
  | {readonly type: 'dispatch-failed'; readonly causes: readonly unknown[]}
  | {readonly type: 'snapshot-unavailable'}
  | {readonly type: 'snapshot-failed'; readonly cause: unknown}

type ErrorDetail =
  | RequestErrorDetail
  | {readonly type: 'invalid-port'; readonly port: number}
  | {readonly type: 'startup-canceled'}
  | {readonly type: 'startup-failed'; readonly cause: unknown}
  | {readonly type: 'server-failed'; readonly cause: unknown}
  | {readonly type: 'send-failed'; readonly cause: unknown}
  | {readonly type: 'cleanup-failed'; readonly causes: readonly unknown[]}
  | {
      readonly type: 'callback-failed'
      readonly callback: 'listening' | 'error'
      readonly cause: unknown
    }

/** Plain error values, discriminated by type. Original failures remain local causes. */
export type RemoteControlError = ErrorDetail & {readonly message: string}
export type RequestError = RequestErrorDetail & {readonly message: string}

/** The one place that assigns messages to remote-control failures. */
export function remoteError<T extends ErrorDetail>(
  detail: T,
): T & {readonly message: string} {
  return {...detail, message: errorMessage(detail)}
}

function errorMessage(error: ErrorDetail): string {
  switch (error.type) {
    case 'invalid-json':
      return 'Invalid JSON'
    case 'invalid-event':
      return error.reason === 'snapshot-format'
        ? "Snapshot format must be 'plain' or 'ansi'"
        : 'Expected a SystemEvent (key, mouse, paste, focus, blur, or resize) or snapshot request'
    case 'binary-message':
      return 'Send a SystemEvent or snapshot request as a JSON text message'
    case 'dispatch-failed':
      return error.causes.length === 1
        ? causeMessage(error.causes[0], 'Remote control input callback failed')
        : 'Remote control input callbacks failed'
    case 'snapshot-unavailable':
      return 'No snapshot provider registered'
    case 'snapshot-failed':
      return causeMessage(error.cause, 'Remote control snapshot failed')
    case 'invalid-port':
      return 'Remote control port must be an integer from 0 to 65535'
    case 'startup-canceled':
      return 'Remote control startup canceled'
    case 'startup-failed':
      return causeMessage(error.cause, 'Remote control setup failed')
    case 'server-failed':
      return causeMessage(error.cause, 'Remote control server failed')
    case 'send-failed':
      return causeMessage(error.cause, 'Remote control reply failed')
    case 'cleanup-failed':
      return 'Remote control cleanup failed'
    case 'callback-failed':
      return `Remote control ${error.callback} callback failed: ${causeMessage(error.cause, 'unknown cause')}`
  }
}

// Never coerce an arbitrary thrown value. Even reading a message can throw.
function causeMessage(cause: unknown, fallback: string): string {
  if (typeof cause === 'string') return cause
  try {
    if (typeof cause === 'object' && cause !== null && 'message' in cause) {
      const message = cause.message
      if (typeof message === 'string') return message
    }
  } catch {
    // A throwing getter/proxy must not escape the error boundary.
  }
  return fallback
}
