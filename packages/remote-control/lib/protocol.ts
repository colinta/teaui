import {isSystemEvent} from './validate.js'
import {ok, err, type Result} from '@teaui/result'
import type {RemoteControlRequest, RemoteControlReply} from './types.js'
import {remoteError, type RequestError} from './errors.js'

/** Only public wire fields leave the process; never serialize local causes. */
export function errorReply(
  sequence: number,
  error: RequestError,
): Extract<RemoteControlReply, {type: 'error'}> {
  return {type: 'error', sequence, code: error.type, message: error.message}
}

/** Decode one message. This function has no socket or subscriber side effects. */
export function decodeMessage(
  text: string,
  isBinary: boolean,
): Result<RemoteControlRequest, RequestError> {
  if (isBinary) {
    return err(remoteError({type: 'binary-message'}))
  }
  let event: unknown
  try {
    event = JSON.parse(text)
  } catch {
    return err(remoteError({type: 'invalid-json'}))
  }
  if (
    typeof event === 'object' &&
    event !== null &&
    !Array.isArray(event) &&
    (event as Record<string, unknown>).type === 'snapshot'
  ) {
    const format = (event as Record<string, unknown>).format
    if (format === 'plain' || format === 'ansi') {
      return ok({type: 'snapshot', format})
    }
    return err(remoteError({type: 'invalid-event', reason: 'snapshot-format'}))
  }
  return isSystemEvent(event)
    ? ok(event)
    : err(remoteError({type: 'invalid-event', reason: 'shape'}))
}
