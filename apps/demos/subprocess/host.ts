import path from 'path'
import {fileURLToPath} from 'url'
import {
  Screen,
  Box,
  Text,
  Stack,
  Window,
  Style,
  interceptConsoleLog,
  ConsoleLog,
} from '@teaui/core'
import {SubprocessView} from '@teaui/subprocess'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  interceptConsoleLog()

  const consoleLog = new ConsoleLog({height: 5})

  const [screen, program] = await Screen.start(
    async () => {
      const subprocess = new SubprocessView({
        command: 'npx',
        args: ['tsx', path.resolve(__dirname, 'simple.ts')],
        onData: data => {
          // Log raw output length for debugging
        },
        onExit: code => {
          console.log(`Child exited with code ${code}`)
          screen.render()
        },
      })

      return new Window({
        child: Stack.down([
          new Box({
            border: 'single',
            height: 3,
            child: new Text({
              text: ' Subprocess Host',
              style: new Style({bold: true}),
            }),
          }),
          ['flex1', subprocess],
          ['natural', consoleLog],
        ]),
      })
    },
    {quitChar: undefined},
  )

  program.key('C-q', () => {
    screen.exit()
  })
}

main()
