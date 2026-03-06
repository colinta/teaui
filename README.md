# TeaUI

I wanted a curses-style fullscreen application framework that could be powered by React.

This repo is organized as a pnpm workspace. The main library is in `packages/core`, and the demo code is in `apps/demo`. There are also React and Preact renderers.

### Demo: components

###### [apps/demo/components.ts](https://github.com/colinta/teaui/blob/master/apps/demos/components.ts)

```
pnpm demo components
```

![example of output](https://raw.githubusercontent.com/colinta/teaui/refs/heads/main/readme/components.png)

### Demo: colors.ts

###### [apps/demo/colors.ts](https://github.com/colinta/teaui/blob/master/apps/demos/colors.ts)

```
pnpm demo colors
```

![example of output](https://raw.githubusercontent.com/colinta/teaui/refs/heads/main/readme/colors.png)

### Demo: inputs.ts

###### [apps/demo/inputs.ts](https://github.com/colinta/teaui/blob/master/apps/demos/inputs.ts)

```
pnpm demo inputs.ts
```

![example of output](https://raw.githubusercontent.com/colinta/teaui/refs/heads/main/readme/inputs.png)

### Example using React

I'll use TypeScript's JSX support here, if you want to use something else go ahead.

###### tsconfig.json
```json
{
  "include": ["./"],
  "exclude": [".dist/"],
  "compilerOptions": {
    "target": "esnext",
    "module": "commonjs",
    "moduleResolution": "node",
    "declaration": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "noImplicitAny": true,
    "skipLibCheck": true,
    "allowJs": true,
    "outDir": ".dist",
    "jsx": "react"
  }
}
```

```bash
pnpm install @teaui/core @teaui/react react @types/react
```

###### index.tsx
```tsx
import React, {useReducer} from 'react'
import {interceptConsoleLog} from '@teaui/core'
import {
  Box,
  Button,
  Stack,
  run,
} from '@teaui/react'

// Recommended:
interceptConsoleLog()

function App() {
  const [bang, goto10] = useReducer((state) => state + '!', '')

  return (
    <Box border="single">
      <Stack.down>
        First there was Ncurses{bang}
        <Button onClick={goto10}>Tell me more!</Button>
      </Stack.down>
    </Box>
  )
}

run(<App />)
```

```bash
pnpm tsc
node .dist/index.js
```

### Example using core library

###### example.js
```javascript
import {Screen, Box, Stack, Text, Button, interceptConsoleLog} from '@teaui/core'

// Recommended:
interceptConsoleLog()
// While the terminal is in full screen mode, you probably don't want to log
// debug info to stdout - it will appear wherever the cursor happens to be,
// and will clobber your output. You can mount the <ConsoleLog /> to view logs,
// otherwise when you exit (Ctrl-C) the logs will be flushed to stdout.

Screen.start(
  new Box({
    border: 'single',
    children: [
      Stack.down([
        new Text({text: 'Why is it called TeaUI?'}),
        new Button({title: 'Tell me!'}),
      ]),
    ],
  }),
)
```

### ~Zero dependencies~ 🤔

Rather than including depencies like a reasonable person, I copied the code I
needed (and their licenses, of course). I put these dependencies in as
`optionalDependencies` so they still get the npm backlinks. I'm not stuck on
having a zero-dependencies package, it's just how I did it. Let me know what you
think in [the comments section](/dev/null).

#### TODO / Improvements

[get-east-asian-width](https://www.npmjs.com/package/get-east-asian-width) is a
much newer package, and [sindresorhus](https://github.com/sindresorhus) is a
prolific writer of terminal-related code, so switching to that seems like a good
idea. YAGNI for now, but it's on the list.

Blessed is a very powerful library, but I'm not using ~80-90% of it. All I
really need is _goto XY, writeChar, flush_ along with the code that sets up
raw-mode, mouse-events, resize events, etc.
[termbox2](https://github.com/RauliL/termbox2-node) maybe?

- https://github.com/vangie/east-asian-width
- https://github.com/komagata/eastasianwidth
- https://github.com/chalk/ansi-regex
