// Node-only hooks, guarded so core can load without Node globals (e.g. in a
// browser).

interface ProcessWithExitEvent {
  on(event: 'exit', listener: () => void): unknown
}

/** Run `listener` when the Node process exits. No-op without a process. */
export function onProcessExit(listener: () => void) {
  const nodeProcess = (globalThis as {process?: Partial<ProcessWithExitEvent>})
    .process
  nodeProcess?.on?.('exit', listener)
}
