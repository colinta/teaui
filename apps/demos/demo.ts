import net from 'node:net'
import fs from 'node:fs'

import {
  Screen,
  TrackMouse,
  ConsoleLog,
  Stack,
  Window,
  type View,
  interceptConsoleLog,
  fetchLogs,
  addListener,
} from '@teaui/core'

const LOG_VIEWER_SOCKET = '/tmp/teaui-log-viewer.sock'

interceptConsoleLog()

let socketClients: Set<net.Socket> | undefined
let socketServer: net.Server | undefined

if (process.argv.includes('--socket')) {
  socketClients = new Set()
  socketServer = net.createServer(socket => {
    socketClients!.add(socket)
    socket.on('close', () => socketClients!.delete(socket))
    socket.on('error', () => socketClients!.delete(socket))
  })

  try {
    fs.unlinkSync(LOG_VIEWER_SOCKET)
  } catch {}

  socketServer.listen(LOG_VIEWER_SOCKET)

  addListener(({level, args}) => {
    fetchLogs()
    const message = JSON.stringify({level, args}) + '\n'
    for (const client of socketClients!) {
      try {
        client.write(message)
      } catch {}
    }
  })

  process.on('exit', () => {
    socketServer?.close()
    try {
      fs.unlinkSync(LOG_VIEWER_SOCKET)
    } catch {}
  })
}

export async function demo(
  demoContent: View,
  showConsoleLog: boolean | number = false,
) {
  process.title = 'TeaUI'
  if (process.argv.includes('--no-log')) {
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

  if (process.argv.includes('--exit')) {
    setTimeout(() => {
      screen.exit()
    }, 100)
  }

  screen.key('escape', function () {
    consoleLog.clear()
    screen.render()
  })
}
