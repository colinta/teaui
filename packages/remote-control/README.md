# @teaui/remote-control

Optional local WebSocket input and snapshot transport for TeaUI. Depends on the
public APIs of `@teaui/core` and `@teaui/result`; core does not depend on this package.

```ts
import {RemoteControlServer} from '@teaui/remote-control'

const remote = new RemoteControlServer()
screen.addEventSource(remote)
const detachSnapshot = remote.setSnapshotProvider(() => screen.snapshot())
screen.onExit(() => {
  detachSnapshot()
  void remote.close()
})

const result = await remote.listen()
if (result.ok) {
  // Publish result.value.url privately. It contains the connection secret.
} else {
  // Report result.error through the application's logger.
}
```

Send a `SystemEvent` JSON message for input, or
`{"type":"snapshot","format":"plain"}` to request a snapshot. Use `"ansi"` for
styled output. The provider always returns one ANSI string; remote control removes
ANSI when plain output is requested. Capture never triggers a render.
`remote.sendSnapshot(format, ansiSnapshot)` applies the same conversion and
broadcasts to current clients. Each broadcast is encoded once, with per-client
backpressure checks and no retained snapshot cache.

Screen owns event subscriptions. The application owns the server's lifetime.
Closing the server preserves registrations, and a later `listen()` starts a fresh
session with a new token. `listen()` returns
`Result<RemoteControlAddress, RemoteControlError>` and `close()` returns
`Result<void, RemoteControlError>` through their promises; neither rejects for
operation failures. Result types and helpers are exported by `@teaui/result`.

`RemoteControlError` is a plain discriminated union exported by this package, not
a JavaScript `Error` subclass. Switch on `error.type`: `invalid-port` carries
`port`; `startup-failed`, `server-failed`, `send-failed`, and `snapshot-failed`
carry an original `cause`; `dispatch-failed` and `cleanup-failed` carry `causes`.
`callback-failed` identifies `callback: 'listening' | 'error'` and its `cause`.
Cancellation is `startup-canceled`. Request-validation variants are
`invalid-json`, `invalid-event` (with a `reason`), `binary-message`, and
`snapshot-unavailable`. Every variant has a display `message`.

`onError()` receives the same union. Startup and cleanup failures are reported
both through their Result and `onError()`; choose one reporting path to avoid
duplicates. Cancellation is not an error notification. Request failures keep the
existing wire `{type: 'error', sequence, code, message}` shape; local causes and
other diagnostic details are never serialized into replies.

See [the remote-control guide](../../apps/docs/docs/remote-control.mdx) for lifecycle,
protocol, and security details. The source-checkout JSONL driver is
`examples/remote-control.mjs`.
