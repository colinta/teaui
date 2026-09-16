import {
  removeAnsi,
  type SystemEvent,
  type EventSource,
  type Unsubscribe,
} from '@teaui/core'
import {ok, err, type Result} from '@teaui/result'
import {Callbacks} from './Callbacks.js'
import {Session} from './Session.js'
import {
  remoteError,
  type RemoteControlError,
  type RequestError,
} from './errors.js'
import type {
  RemoteControlOptions,
  RemoteControlAddress,
  SnapshotFormat,
} from './types.js'

/** A reusable input source with optional snapshot output. Registrations survive restart. */
export class RemoteControlServer implements EventSource {
  #options: RemoteControlOptions
  #session?: Session
  #snapshotProvider?: () => string
  #closing: Promise<Result<void, RemoteControlError>> = Promise.resolve(
    ok(undefined),
  )
  #events = new Callbacks<SystemEvent>(cause =>
    this.#reportError(remoteError({type: 'dispatch-failed', causes: [cause]})),
  )
  #listening = new Callbacks<RemoteControlAddress>(cause =>
    this.#reportError(
      remoteError({type: 'callback-failed', callback: 'listening', cause}),
    ),
  )
  #errors = new Callbacks<RemoteControlError>(cause => this.#warn(cause))

  constructor(options: RemoteControlOptions = {}) {
    this.#options = {...options}
  }

  /**
   * Start listening, or join the current startup. When already listening, return
   * its address. After close/failure, start a fresh run once prior cleanup ends.
   * Startup failures resolve an error Result and notify onError; they do not reject.
   */
  listen(): Promise<Result<RemoteControlAddress, RemoteControlError>> {
    if (this.#session) return this.#session.ready
    const session = new Session(this.#options, {
      dispatch: event => this.#dispatch(event),
      snapshot: format => this.#snapshot(format),
      failed: error => {
        if (this.#session !== session) return
        void this.close() // Cleanup failures are reported through onError.
        this.#reportError(error)
      },
      sendFailed: error => {
        if (this.#session === session) this.#reportError(error)
      },
    })
    this.#session = session
    // A failed cleanup is reported by close(). Wait for all its attempts before
    // starting again; a new bind must report its own result, not an old failure.
    session.start(this.#closing.then(() => {}))
    void session.ready.then(result => {
      if (!result.ok || this.#session !== session) return
      for (const cause of this.#listening.emit(
        result.value,
        () => this.#session === session,
      )) {
        this.#reportError(
          remoteError({type: 'callback-failed', callback: 'listening', cause}),
        )
      }
    })
    return session.ready
  }

  /** Synchronous delivery errors become dispatch-failed replies; later rejections use onError. */
  #dispatch(event: SystemEvent): Result<void, RequestError> {
    const causes = this.#events.emit(event)
    return causes.length
      ? err(remoteError({type: 'dispatch-failed', causes}))
      : ok(undefined)
  }

  /**
   * Supply snapshots on demand without coupling this source to a screen. Replaces
   * the previous provider; its detach function cannot remove a newer provider.
   * The registration survives close/restart. Providers synchronously return ANSI.
   */
  setSnapshotProvider(provider: () => string): Unsubscribe {
    const registration = () => provider()
    this.#snapshotProvider = registration
    return () => {
      if (this.#snapshotProvider === registration)
        this.#snapshotProvider = undefined
    }
  }

  #snapshot(format: SnapshotFormat): Result<string, RequestError> {
    if (!this.#snapshotProvider)
      return err(remoteError({type: 'snapshot-unavailable'}))
    try {
      return ok(formatSnapshot(this.#snapshotProvider(), format))
    } catch (cause) {
      return err(remoteError({type: 'snapshot-failed', cause}))
    }
  }

  /** Format and broadcast an ANSI snapshot. No queue/replay while stopped. */
  sendSnapshot(format: SnapshotFormat, ansiSnapshot: string): void {
    this.#session?.sendSnapshot(format, formatSnapshot(ansiSnapshot, format))
  }

  /** Register input delivery independently of whether the server is running. */
  onEvents(listener: (event: SystemEvent) => void): Unsubscribe {
    return this.#events.subscribe(listener)
  }

  /**
   * Notify once per successful run, until detached. A subscriber added while
   * listening gets the current address in a microtask, unless that run stops.
   */
  onListening(
    listener: (address: RemoteControlAddress) => void | Promise<void>,
  ): Unsubscribe {
    let active = true
    let notified: Session | undefined
    const notify = (address: RemoteControlAddress) => {
      const session = this.#session
      if (!active || !session || notified === session) return
      notified = session
      return listener(address)
    }
    const detach = this.#listening.subscribe(notify)
    const session = this.#session
    const address = session?.address
    if (address)
      queueMicrotask(() => {
        if (this.#session !== session) return
        const result = this.#listening.invoke(notify, address)
        if (!result.ok)
          this.#reportError(
            remoteError({
              type: 'callback-failed',
              callback: 'listening',
              cause: result.error,
            }),
          )
      })
    return () => {
      active = false
      detach()
    }
  }

  /** Future errors only. Registration survives close; no past failures are replayed. */
  onError(
    listener: (error: RemoteControlError) => void | Promise<void>,
  ): Unsubscribe {
    return this.#errors.subscribe(listener)
  }

  #reportError(error: RemoteControlError) {
    for (const failure of this.#errors.emit(error)) this.#warn(failure)
  }

  #warn(cause: unknown) {
    // Do not recursively call a failing error callback. Node accepts warning text.
    const error = remoteError({
      type: 'callback-failed',
      callback: 'error',
      cause,
    })
    process.emitWarning(error.message)
  }

  /** The current bound address only. Undefined before binding and after close. */
  get url(): string | undefined {
    return this.#session?.address?.url
  }
  get port(): number | undefined {
    return this.#session?.address?.port
  }
  /** True when idle or closing; false while starting or listening. */
  get closed(): boolean {
    return this.#session === undefined
  }

  /**
   * Cancel the current run immediately, without removing subscriptions. Wait for
   * cleanup if needed. Cleanup failures resolve an error Result and notify onError.
   * A following listen() waits for cleanup attempts, then starts a fresh run.
   */
  close(): Promise<Result<void, RemoteControlError>> {
    const session = this.#session
    if (!session) return this.#closing
    this.#session = undefined
    this.#closing = session.close()
    void this.#closing.then(result => {
      if (!result.ok) this.#reportError(result.error)
    })
    return this.#closing
  }
}

function formatSnapshot(snapshot: string, format: SnapshotFormat): string {
  return format === 'plain' ? removeAnsi(snapshot) : snapshot
}
