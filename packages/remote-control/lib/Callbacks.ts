import type {Unsubscribe} from '@teaui/core'
import {ok, err, type Result} from '@teaui/result'

type Listener<T> = (value: T) => void | Promise<void>

/** Internal callback registrations. A detach function owns one registration. */
export class Callbacks<T> {
  #listeners = new Set<Listener<T>>()
  #onRejected: (cause: unknown) => void

  constructor(onRejected: (cause: unknown) => void) {
    this.#onRejected = onRejected
  }

  subscribe(listener: Listener<T>): Unsubscribe {
    const registration: Listener<T> = value => listener(value)
    this.#listeners.add(registration)
    return () => {
      this.#listeners.delete(registration)
    }
  }

  /** Snapshot delivery: additions wait for the next event; removals take effect now. */
  emit(value: T, isCurrent: () => boolean = () => true): unknown[] {
    const errors: unknown[] = []
    const snapshot = [...this.#listeners]
    for (const listener of snapshot) {
      if (!isCurrent()) {
        break
      }
      if (!this.#listeners.has(listener)) {
        continue
      }
      const result = this.invoke(listener, value)
      if (!result.ok) {
        errors.push(result.error)
      }
    }
    return errors
  }

  /** Use the same error policy for both broadcasts and targeted readiness notifications. */
  invoke(listener: Listener<T>, value: T): Result<void, unknown> {
    try {
      const pending = listener(value)
      if (pending) {
        void Promise.resolve(pending).catch(cause => this.#onRejected(cause))
      }
      return ok(undefined)
    } catch (cause) {
      return err(cause)
    }
  }
}
