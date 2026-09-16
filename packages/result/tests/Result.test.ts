import {describe, expect, expectTypeOf, it} from 'vitest'
import {ok, err, type Ok, type Err, type Result} from '../lib/index.js'

function result(succeed: boolean): Result<number, string> {
  return succeed ? ok(42) : err('failed')
}

describe('Result', () => {
  it('constructs a success without an error field, including undefined values', () => {
    expect(ok(42)).toEqual({ok: true, value: 42})
    expect(ok(undefined)).toEqual({ok: true, value: undefined})
    expect(ok(false)).toEqual({ok: true, value: false})
    expectTypeOf(ok(42)).toEqualTypeOf<Ok<number>>()
  })

  it('preserves typed failures without a value field', () => {
    const error = new Error('failed')
    expect(err(error)).toEqual({ok: false, error})
    expect(err(error).error).toBe(error)
    expect(err('failed')).toEqual({ok: false, error: 'failed'})
    expectTypeOf(err('failed')).toEqualTypeOf<Err<string>>()
  })

  it.each([true, false])(
    'narrows on the boolean discriminant (%s)',
    succeed => {
      const outcome = result(succeed)
      // @ts-expect-error The payload cannot be used without narrowing.
      expectTypeOf(outcome.value)
      if (outcome.ok) {
        expectTypeOf(outcome.value).toEqualTypeOf<number>()
        expect(outcome.value).toBe(42)
        // @ts-expect-error The success variant has no error.
        expectTypeOf(outcome.error)
      } else {
        expectTypeOf(outcome.error).toEqualTypeOf<string>()
        expect(outcome.error).toBe('failed')
        // @ts-expect-error The failure variant has no value.
        expectTypeOf(outcome.value)
      }
    },
  )

  it('defaults errors to Error and exposes readonly variants', () => {
    expectTypeOf<Result<number>>().toEqualTypeOf<Result<number, Error>>()
    expectTypeOf<Ok<number>>().toEqualTypeOf<{
      readonly ok: true
      readonly value: number
    }>()
    expectTypeOf<Err<string>>().toEqualTypeOf<{
      readonly ok: false
      readonly error: string
    }>()
  })
})
