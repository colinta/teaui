import {describe, expect, expectTypeOf, it, vi} from 'vitest'
import type {Result} from '@teaui/result'
import type {
  RemoteControlServer,
  RemoteControlError,
  RemoteControlAddress,
} from '../lib/index.js'
import {remoteError} from '../lib/errors.js'
import {errorReply} from '../lib/protocol.js'
import {Callbacks} from '../lib/Callbacks.js'

const hostile = {
  get message(): string {
    throw new Error('message getter failed')
  },
  toString() {
    throw new Error('coercion failed')
  },
}
const failures = [
  undefined,
  null,
  false,
  0,
  Symbol('failure'),
  Object.create(null),
  hostile,
]

describe('remote-control error values', () => {
  it('exposes discriminated errors through Results and onError, not native Error', () => {
    expectTypeOf<ReturnType<RemoteControlServer['listen']>>().toEqualTypeOf<
      Promise<Result<RemoteControlAddress, RemoteControlError>>
    >()
    expectTypeOf<ReturnType<RemoteControlServer['close']>>().toEqualTypeOf<
      Promise<Result<void, RemoteControlError>>
    >()
    expectTypeOf<
      Parameters<Parameters<RemoteControlServer['onError']>[0]>[0]
    >().toEqualTypeOf<RemoteControlError>()
    expectTypeOf<
      Extract<RemoteControlError, {type: 'invalid-port'}>['port']
    >().toEqualTypeOf<number>()
    expectTypeOf<
      Extract<RemoteControlError, {type: 'cleanup-failed'}>['causes']
    >().toEqualTypeOf<readonly unknown[]>()
    const error = remoteError({type: 'invalid-port', port: -1})
    expect(Object.getPrototypeOf(error)).toBe(Object.prototype)
    expect(error).not.toBeInstanceOf(Error)
  })

  it.each(failures)(
    'keeps an arbitrary cause without coercing it (%#)',
    cause => {
      const error = remoteError({type: 'snapshot-failed', cause})
      expect(error).toEqual({
        type: 'snapshot-failed',
        cause,
        message: 'Remote control snapshot failed',
      })
      expect(error.cause).toBe(cause)
      expect(
        remoteError({type: 'dispatch-failed', causes: [cause]}).message,
      ).toBe('Remote control input callback failed')
    },
  )

  it.each(['failed', new Error('failed'), {message: 'failed'}])(
    'uses a safe cause message (%#)',
    cause => {
      expect(remoteError({type: 'snapshot-failed', cause}).message).toBe(
        'failed',
      )
      expect(
        remoteError({type: 'dispatch-failed', causes: [cause]}).message,
      ).toBe('failed')
    },
  )

  it('serializes all request errors in one place, without their local details', () => {
    const cause = {
      message: 'failed',
      secret: 'must stay local',
      self: undefined as unknown,
    }
    cause.self = cause // A local cause need not be JSON serializable.
    const errors = [
      remoteError({type: 'invalid-json'}),
      remoteError({type: 'invalid-event', reason: 'shape'}),
      remoteError({type: 'invalid-event', reason: 'snapshot-format'}),
      remoteError({type: 'binary-message'}),
      remoteError({type: 'dispatch-failed', causes: [cause, undefined]}),
      remoteError({type: 'snapshot-unavailable'}),
      remoteError({type: 'snapshot-failed', cause}),
    ]
    for (const [index, error] of errors.entries()) {
      const reply = errorReply(index + 1, error)
      expect(reply).toEqual({
        type: 'error',
        sequence: index + 1,
        code: error.type,
        message: error.message,
      })
      expect(JSON.stringify(reply)).not.toContain('must stay local')
    }
  })

  it.each(failures)(
    'preserves falsy and unusual synchronous/async callback failures (%#)',
    async cause => {
      const rejected = vi.fn()
      const callbacks = new Callbacks<void>(rejected)
      const detach = callbacks.subscribe(() => {
        throw cause
      })
      const causes = callbacks.emit()
      expect(causes).toHaveLength(1)
      expect(causes[0]).toBe(cause)
      const result = callbacks.invoke(() => {
        throw cause
      }, undefined)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toBe(cause)
      detach()
      callbacks.subscribe(() => Promise.reject(cause))
      expect(callbacks.emit()).toEqual([])
      await Promise.resolve()
      expect(rejected.mock.calls).toHaveLength(1)
      expect(rejected.mock.calls[0][0]).toBe(cause)
    },
  )
})
