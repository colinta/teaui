import net from 'node:net'
import fs from 'node:fs'

import {
  AutoLegend,
  Collapsible,
  ConsoleLog,
  HotKey,
  Input,
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

import {type FilterNode, parseFilter, matchFilter} from './parser.js'
import {LOG_VIEWER_SOCKET} from './protocol.js'
import type {Message} from './protocol.js'

interceptConsoleLog()

// ── Per-client state ────────────────────────────────────────────────────────

interface LogEntry {
  level: string
  text: string
  view: Collapsible
}

interface ClientState {
  name: string
  entries: LogEntry[]
  filter: FilterNode | undefined
  scrollable: Scrollable
  filterInput: Input
  tab: ReturnType<typeof createClientTab>
}

const clients = new Map<net.Socket, ClientState>()

// ── Shared UI ───────────────────────────────────────────────────────────────

const consoleLog = new ConsoleLog({})

const tabs = new Tabs({border: false})
tabs.addTab('Local', consoleLog)

const [screen] = await Screen.start(
  () =>
    new Window({
      child: tabs,
    }),
  {quitChar: 'C-c'},
)

// ── Socket server ───────────────────────────────────────────────────────────

try {
  fs.unlinkSync(LOG_VIEWER_SOCKET)
} catch {}

const server = net.createServer(socket => {
  let buffer = ''
  let state: ClientState | undefined

  socket.on('data', data => {
    buffer += data.toString()
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line) continue
      try {
        const message = JSON.parse(line) as Message
        if (message.type === 'register') {
          state = addClient(socket, message.name)
        } else if (message.type === 'log' && state) {
          addLogEntry(state, message.level, message.args)
        }
      } catch {}
    }

    screen.render()
  })

  socket.on('close', () => {
    removeClient(socket)
    screen.render()
  })

  socket.on('error', () => {
    removeClient(socket)
    screen.render()
  })
})

server.listen(LOG_VIEWER_SOCKET, () => {
  console.log('Listening on', LOG_VIEWER_SOCKET)
  screen.render()
})

process.on('exit', () => {
  server.close()
  try {
    fs.unlinkSync(LOG_VIEWER_SOCKET)
  } catch {}
})

// ── Client management ───────────────────────────────────────────────────────

function addClient(socket: net.Socket, name: string): ClientState {
  const scrollable = new Scrollable({
    keepAtBottom: true,
    direction: 'down',
  })

  const filterInput = new Input({
    placeholder: 'Filter logs… (supports "quoted" /regex/ AND OR)',
    onChange: (value: string) => {
      const state = clients.get(socket)
      if (!state) return
      state.filter = value.trim() ? parseFilter(value) : undefined
      rebuildVisible(state)
      screen.render()
    },
    height: 1,
  })

  const legend = new AutoLegend()

  const tab = createClientTab(scrollable, filterInput, legend)

  const state: ClientState = {
    name,
    entries: [],
    filter: undefined,
    scrollable,
    filterInput,
    tab,
  }

  clients.set(socket, state)
  tabs.addTab(name, tab)
  // switch to newly connected tab
  tabs.selected = tabs.tabs.length - 1
  console.log(`Client connected: ${name}`)

  return state
}

function removeClient(socket: net.Socket) {
  const state = clients.get(socket)
  if (!state) return
  clients.delete(socket)

  const tabIndex = tabs.tabs.findIndex(tab => tab.title === state.name)
  if (tabIndex >= 0) {
    tabs.removeTab(tabIndex)
  }

  console.log(`Client disconnected: ${state.name}`)
}

function createClientTab(
  scrollable: Scrollable,
  filterInput: Input,
  legend: AutoLegend,
) {
  return new HotKey({
    hotKey: {char: 'k', ctrl: true},
    label: 'Clear',
    onPress: () => {
      // find which client owns this scrollable
      for (const state of clients.values()) {
        if (state.scrollable === scrollable) {
          state.entries.length = 0
          scrollable.removeAllChildren()
          screen.render()
          break
        }
      }
    },
    child: Stack.down({
      children: [
        ['natural', legend],
        ['natural', filterInput],
        ['flex1', scrollable],
      ],
    }),
  })
}

// ── Log entries ─────────────────────────────────────────────────────────────

function addLogEntry(state: ClientState, level: string, args: any[]) {
  const expandedText = args
    .map(arg => (typeof arg === 'string' ? arg : inspect(arg, true)))
    .join(' ')
  const collapsedText = args
    .map(arg => (typeof arg === 'string' ? arg : inspect(arg, false)))
    .join(' ')

  const expanded = new Text(expandedText)
  const collapsed = new Text(collapsedText)

  const view = new Collapsible({
    expanded,
    collapsed,
    isCollapsed: true,
  })

  const entry: LogEntry = {
    level,
    text: collapsedText,
    view,
  }
  state.entries.push(entry)

  if (!state.filter || matchFilter(state.filter, entry.text)) {
    state.scrollable.add(Stack.right([view]))
  }
}

function rebuildVisible(state: ClientState) {
  state.scrollable.removeAllChildren()
  for (const entry of state.entries) {
    if (!state.filter || matchFilter(state.filter, entry.text)) {
      state.scrollable.add(Stack.right([entry.view]))
    }
  }
}
