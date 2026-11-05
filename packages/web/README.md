# @teaui/web

Run TeaUI apps in the browser, inside the
[wterm](https://github.com/vercel-labs/wterm) terminal emulator. No server or
PTY is needed: TeaUI's `Screen` runs in the page and talks to wterm directly.

```ts
import '@wterm/dom/css'
import {Box, Text} from '@teaui/core'
import {startInWterm} from '@teaui/web'

const session = await startInWterm(
  document.getElementById('terminal')!,
  new Box({border: 'rounded', child: new Text({text: 'Hello, browser!'})}),
)

// later
session.destroy()
```

React:

```tsx
import '@wterm/dom/css'
import {runInWterm} from '@teaui/web/react'

const session = await runInWterm(element, <App />, {
  wterm: {cols: 80, rows: 24, autoResize: false},
  quitChar: false,
})
```

## API

- `startInWterm(element, view | () => view, options)` — mount wterm and start a
  `Screen`. Returns `{screen, rootView, wterm, host, destroy}`.
- `runInWterm(element, reactNode, options)` (`@teaui/web/react`) — the browser
  equivalent of `run()` from `@teaui/react`. Also returns `unmount`.
- `mountWterm(element, options)` — lower level: mount wterm and return the
  connected `WebTerminalHost`, then call `Screen.start(view, {terminal:
host.terminalOptions})` yourself.
- `WebTerminalHost` — framework-agnostic bridge for any browser terminal
  emulator: feed it input with `receive(data)`, sizes with `resize(cols, rows)`,
  and give it a sink with `write(data)`.

Options: `wterm` (passed to `new WTerm`, except `onData`/`onResize`), `env`
(merged over `{TERM: 'xterm-256color', COLORTERM: 'truecolor'}`), `onExit`
(called after `screen.exit()`, e.g. from `quitChar`), and any other
`ScreenOptions`.

Browser shortcuts (Cmd/Ctrl+W, T, N, L…) never reach the terminal. Consider
`quitChar: false` when there is nothing to exit to. Press Esc then Tab to move
focus from the terminal back to the page.

Packages with Node-only dependencies (`@teaui/image`, `@teaui/code`,
`@teaui/subprocess`) don't work in the browser.

### Bundler note

If your bundler compiles dependencies with Babel in _loose_ mode for old
browsers (e.g. Docusaurus' default), target modern browsers instead. Loose
mode assumes every iterable is an array and rewrites private class fields,
both of which break TeaUI.
