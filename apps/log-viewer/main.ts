import net from 'node:net'

import {
  AutoLegend,
  Collapsible,
  ConsoleLog,
  HotKey,
  Screen,
  Scrollable,
  Stack,
  Style,
  Tabs,
  Text,
  Window,
  centerPad,
  interceptConsoleLog,
} from '@teaui/core'
import {inspect} from '@teaui/inspect'

interceptConsoleLog()

const LOG_VIEWER_SOCKET = '/tmp/teaui-log-viewer.sock'

const socketScrollable = new Scrollable({
  keepAtBottom: true,
  direction: 'down',
})

const legend = new AutoLegend()

const socketTab = new HotKey({
  hotKey: {char: 'k', ctrl: true},
  label: 'Clear',
  onPress: () => {
    socketScrollable.removeAllChildren()
    screen.render()
  },
  child: Stack.down({
    children: [
      ['natural', legend],
      ['flex1', socketScrollable],
    ],
  }),
})

const consoleLog = new ConsoleLog({})

const tabs = Tabs.create(
  [
    ['Socket', socketTab],
    ['Local', consoleLog],
  ],
  {border: false},
)

const [screen] = await Screen.start(
  () =>
    new Window({
      child: tabs,
    }),
  {quitChar: 'C-c'},
)

console.log('Connecting to', LOG_VIEWER_SOCKET)

const client = net.createConnection(LOG_VIEWER_SOCKET, () => {
  console.log('Connected to socket')
  screen.render()
})

let buffer = ''
client.on('data', data => {
  buffer += data.toString()
  const lines = buffer.split('\n')
  buffer = lines.pop() ?? ''

  for (const line of lines) {
    if (!line) continue
    try {
      const message = JSON.parse(line) as {level: string; args: any[]}
      addLogEntry(message.level, message.args)
    } catch {}
  }

  screen.render()
})

client.on('close', () => {
  console.log('Socket disconnected')
  screen.render()
})

client.on('error', err => {
  console.error('Socket error:', err.message)
  screen.render()
})

function addLogEntry(level: string, args: any[]) {
  const styledLevel = new Text({text: centerPad(level.toUpperCase(), 7)})
  const expanded = new Text(
    args
      .map(arg => (typeof arg === 'string' ? arg : inspect(arg, true)))
      .join(' '),
  )
  const collapsed = new Text(
    args
      .map(arg => (typeof arg === 'string' ? arg : inspect(arg, false)))
      .join(' '),
  )

  socketScrollable.add(
    Stack.right([
      new Collapsible({
        expanded,
        collapsed,
        isCollapsed: true,
      }),
    ]),
  )
}
