# @teaui/subprocess

Embed child terminal processes inside a TeaUI view. The child runs in its own PTY
(pseudo-terminal) and renders into a `SubprocessView` viewport. When focused,
keyboard and mouse events are forwarded to the child process.

This enables terminal multiplexer-style composition: a TeaUI app can embed other TUI
programs, scripts, or shells inside its layout.

## Installation

```bash
pnpm add @teaui/subprocess
```

**Note:** This package depends on `node-pty` (native C++ addon) and `@xterm/headless`.
The `node-pty` package requires a C++ toolchain for compilation on first install.

## Quick Start

```typescript
import {Screen, Window, Stack, Box, Text, Style} from '@teaui/core'
import {SubprocessView} from '@teaui/subprocess'

const [screen, program] = await Screen.start(async () => {
  const subprocess = new SubprocessView({
    command: '/bin/bash',
    onExit: code => console.log(`Shell exited: ${code}`),
  })

  return new Window({
    child: Stack.down([
      new Box({
        border: 'single',
        height: 3,
        child: new Text({
          text: ' My Terminal App',
          style: new Style({bold: true}),
        }),
      }),
      ['flex1', subprocess],
    ]),
  })
})
```

## API

### `SubprocessView`

Extends `View`. Spawns a child process in a PTY and renders its output.

#### Constructor Props

| Prop      | Type                                      | Default      | Description                                             |
| --------- | ----------------------------------------- | ------------ | ------------------------------------------------------- |
| `command` | `string`                                  | _(required)_ | Command to execute                                      |
| `args`    | `string[]`                                | `[]`         | Command arguments                                       |
| `env`     | `Record<string, string>`                  | `{}`         | Extra environment variables (merged with `process.env`) |
| `cwd`     | `string`                                  | `undefined`  | Working directory for the child                         |
| `onData`  | `(data: string) => void`                  | `undefined`  | Called with raw child stdout data                       |
| `onExit`  | `(code: number, signal?: number) => void` | `undefined`  | Called when the child exits                             |
| `width`   | `Dimension`                               | `'fill'`     | View width                                              |
| `height`  | `Dimension`                               | `'fill'`     | View height                                             |

#### Properties

| Property       | Type                                                       | Description                                       |
| -------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| `processState` | `'idle' \| 'starting' \| 'running' \| 'exited' \| 'error'` | Current process lifecycle state                   |
| `exitCode`     | `number \| null`                                           | Exit code (only when `processState === 'exited'`) |

#### Behavior

- **Rendering:** Reads the xterm-headless buffer cell-by-cell and paints characters with
  full SGR styling (colors, bold, italic, underline, etc.) to the TeaUI viewport.
- **Input forwarding:** When focused, keyboard events are serialized back to ANSI escape
  sequences and written to the PTY. Mouse events are forwarded as SGR mouse sequences.
- **Resize:** Automatically resizes the PTY and xterm terminal when the viewport size changes.
- **Lifecycle:** The PTY is spawned on `didMount` and killed on `didUnmount`.
- **Exit handling:** When the child exits, the final buffer is preserved with an overlay
  showing the exit code.
- **Error handling:** If the command fails to spawn, an error message is displayed.

## Utility Functions

### `keyEventToAnsi(event: KeyEvent): string`

Converts a TeaUI `KeyEvent` back to the raw bytes a terminal would send. Handles:

- Printable characters
- Ctrl+letter (`ctrl+c` → `\x03`)
- Alt+key (`alt+f` → `\x1bf`)
- Arrow keys, Home, End, Page Up/Down, Insert, Delete
- Function keys F1–F12
- Modifier combinations (shift, ctrl, alt, gui)

### `mouseEventToAnsi(event: MouseEvent): string`

Converts a TeaUI `MouseEvent` to an SGR mouse escape sequence for forwarding to a
child PTY. Handles button press/release, scroll wheel, drag, and modifier keys.

### `xtermCellToStyle(cell: XtermCell): Style`

Converts an xterm-headless buffer cell's attributes to a TeaUI `Style` object.
Handles 256-color palette, 24-bit RGB, and all text attributes.

## Architecture

```
Parent TeaUI App
┌──────────────────────────────────────────────────┐
│ Screen (owns stdin/stdout, raw mode)             │
│  └─ Window                                       │
│      └─ Stack.down                               │
│          ├─ Header("My App")                     │
│          ├─ SubprocessView ──┐                   │
│          │   ├─ pty (node-pty)  ──── Child Process│
│          │   ├─ vt (xterm-headless)              │
│          │   └─ cell buffer → render() → Viewport│
│          └─ Button("Quit")                       │
└──────────────────────────────────────────────────┘
```

**Data flows:**

- Child stdout → `pty.onData` → `xterm.write(data)` → buffer cells
- Parent render → `SubprocessView.render()` → read xterm buffer → `viewport.write()`
- User keypress → `receiveKey()` → `keyEventToAnsi()` → `pty.write()`
- User mouse → `receiveMouse()` → `mouseEventToAnsi()` → `pty.write()`
- Viewport resize → `pty.resize()` + `xterm.resize()`

## Dependencies

| Package           | Why                                                                   |
| ----------------- | --------------------------------------------------------------------- |
| `node-pty`        | PTY spawning via `forkpty(3)` — the child needs a real terminal       |
| `@xterm/headless` | Terminal emulator — parses ANSI, maintains cell buffer, zero DOM deps |
| `@teaui/core`     | View base class, Style, geometry, events                              |

## Examples

See `apps/demos/` for working examples:

- `subprocess-simple.ts` — Simple child program for testing
- `subprocess-child.ts` — Interactive child with counter button
- `subprocess-host.ts` — Parent embedding a single subprocess
- `subprocess-split.ts` — Two subprocesses side-by-side with focus switching
