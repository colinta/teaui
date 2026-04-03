import path from 'path'
import {fileURLToPath} from 'url'
import {
  Screen,
  Box,
  Text,
  Input,
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

  const [screen] = await Screen.start(
    async () => {
      const leftBox = new Box({
        border: 'bold',
      })

      const rightBox = new Box({
        border: 'single',
      })

      const left = new SubprocessView({
        command: 'npx',
        args: ['tsx', path.resolve(__dirname, 'components.js')],
        onExit: code => {
          console.info(`Left child exited with code ${code}`)
        },
        onFocus: () => {
          leftBox.border = 'bold'
          rightBox.border = 'single'
        },
        onBlur: () => {
          // border changes are handled by the sibling's onFocus
        },
      })

      const right = new SubprocessView({
        command: 'npx',
        args: ['tsx', path.resolve(__dirname, 'inputs.js')],
        onExit: code => {
          console.info(`Right child exited with code ${code}`)
        },
        onFocus: () => {
          rightBox.border = 'bold'
          leftBox.border = 'single'
        },
        onBlur: () => {
          // border changes are handled by the sibling's onFocus
        },
      })

      leftBox.add(left)
      rightBox.add(right)

      return new Window({
        child: Stack.down([
          new Box({
            border: 'single',
            height: 3,
            child: new Text({
              text: ' Split Subprocess Demo — Tab to switch, Ctrl+X to quit',
              style: new Style({bold: true}),
            }),
          }),
          [
            'flex1',
            Stack.right([
              ['flex1', leftBox],
              ['flex1', rightBox],
            ]),
          ],
          ['natural', consoleLog],
        ]),
      })
    },
    {quitChar: undefined},
  )

  screen.key('C-x', () => {
    screen.exit()
  })
}

main()
