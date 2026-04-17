import path from 'node:path'

import {Command} from 'commander'
import {
  Screen,
  TrackMouse,
  ConsoleLog,
  Stack,
  Window,
  type View,
  interceptConsoleLog,
} from '@teaui/core'
import {
  Client,
  interceptConsoleLog as interceptForLogViewer,
} from '@teaui/log-viewer'

const program = new Command()
  .option('--socket', 'Forward logs to log-viewer')
  .option('--no-log', 'Disable console log panel')
  .option('--exit', 'Auto-exit after startup')
  .allowUnknownOption()
  .parse()

const opts = program.opts<{socket?: boolean; log: boolean; exit?: boolean}>()

if (opts.socket) {
  const name = path.basename(process.argv[1] ?? 'unknown', '.js')
  const client = new Client({name})
  interceptForLogViewer(client)
} else {
  interceptConsoleLog()
}

export async function demo(
  demoContent: View,
  showConsoleLog: boolean | number = false,
) {
  process.title = 'TeaUI'
  if (!opts.log) {
    showConsoleLog = false
  }

  const consoleLog = new ConsoleLog({
    height: typeof showConsoleLog === 'number' ? showConsoleLog : 10,
  })
  const [screen] = await Screen.start(
    async program => {
      // await iTerm2.setBackground(program, [23, 23, 23])

      return new Window({
        child: new TrackMouse({
          child: Stack.down({
            children: showConsoleLog
              ? [
                  ['flex1', demoContent],
                  ['natural', consoleLog],
                ]
              : [['flex1', demoContent]],
          }),
        }),
      })
    },
    {quitChar: 'C-c'},
  )

  if (opts.exit) {
    setTimeout(() => {
      screen.exit()
    }, 100)
  }

  screen.key('escape', function () {
    consoleLog.clear()
    screen.render()
  })
}
