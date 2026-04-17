import net from 'node:net'
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
  addListener,
} from '@teaui/core'

const LOG_VIEWER_SOCKET = '/tmp/teaui-log-viewer.sock'
const RECONNECT_INTERVAL = 2000

const program = new Command()
  .option('--socket', 'Forward logs to log-viewer')
  .option('--no-log', 'Disable console log panel')
  .option('--exit', 'Auto-exit after startup')
  .allowUnknownOption()
  .parse()

const opts = program.opts<{socket?: boolean; log: boolean; exit?: boolean}>()

interceptConsoleLog()

let socketClient: net.Socket | undefined
let reconnectTimer: ReturnType<typeof setTimeout> | undefined

if (opts.socket) {
  const name = path.basename(process.argv[1] ?? 'unknown', '.js')

  function connect() {
    const client = net.createConnection(LOG_VIEWER_SOCKET, () => {
      socketClient = client
      client.write(JSON.stringify({type: 'register', name}) + '\n')
    })

    client.on('error', (err: NodeJS.ErrnoException) => {
      socketClient = undefined
      scheduleReconnect()
    })

    client.on('close', () => {
      socketClient = undefined
      scheduleReconnect()
    })
  }

  function scheduleReconnect() {
    if (reconnectTimer) return
    reconnectTimer = setTimeout(() => {
      reconnectTimer = undefined
      connect()
    }, RECONNECT_INTERVAL)
    reconnectTimer.unref()
  }

  connect()

  addListener(({level, args}) => {
    if (!socketClient) return
    try {
      const message = JSON.stringify({type: 'log', level, args}) + '\n'
      socketClient.write(message)
    } catch {}
  })

  process.on('exit', () => {
    if (reconnectTimer) clearTimeout(reconnectTimer)
    socketClient?.end()
  })
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
