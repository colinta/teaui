import net from 'node:net'
import fs from 'node:fs'

import {
  AutoLegend,
  ConsoleLog,
  HotKey,
  Input,
  Log,
  Screen,
  Stack,
  Tabs,
  Window,
  interceptConsoleLog,
  type LogLine,
} from '@teaui/core'

import {
  type FilterNode,
  type ParseResult,
  parseFilter,
  matchFilter,
} from './parser.js'
import {LOG_VIEWER_SOCKET} from './protocol.js'
import type {Message} from './protocol.js'

interceptConsoleLog()

// ── Per-client state ────────────────────────────────────────────────────────

interface LogEntry {
  level: string
  text: string
  line: LogLine
}

interface ClientState {
  name: string
  entries: LogEntry[]
  filter: FilterNode | undefined
  log: Log
  filterInput: Input
  tabContent: ReturnType<typeof createClientTab>
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
  const log = new Log()

  const filterInput = new Input({
    placeholder: 'Filter logs… (supports "quoted" /regex/ AND OR)',
    onChange: (value: string) => {
      const state = clients.get(socket)
      if (!state) return
      const result = value.trim() ? parseFilter(value) : undefined
      state.filter = result?.type === 'success' ? result.node : undefined
      rebuildVisible(state)
      screen.render()
    },
    height: 1,
  })

  const legend = new AutoLegend()

  const tabContent = createClientTab(log, filterInput, legend)

  const state: ClientState = {
    name,
    entries: [],
    filter: undefined,
    log,
    filterInput,
    tabContent,
  }

  clients.set(socket, state)
  tabs.addTab(name, tabContent)
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

function createClientTab(log: Log, filterInput: Input, legend: AutoLegend) {
  const clearHotKey = new HotKey({
    hotKey: {char: 'k', ctrl: true},
    label: 'Clear',
    onPress: () => {
      for (const state of clients.values()) {
        if (state.log === log) {
          state.entries.length = 0
          log.clear()
          screen.render()
          break
        }
      }
    },
  })

  return Stack.down({
    children: [
      ['natural', legend],
      ['natural', clearHotKey],
      ['natural', filterInput],
      ['flex1', log],
    ],
  })
}

// ── Log entries ─────────────────────────────────────────────────────────────

function addLogEntry(state: ClientState, level: string, args: any[]) {
  const text = args.map(arg => `${arg}`).join(' ')
  const line: LogLine = {level: level as LogLine['level'], args}

  const entry: LogEntry = {level, text, line}
  state.entries.push(entry)

  state.log.setLogs(
    state.entries
      .filter(e => !state.filter || matchFilter(state.filter, e.text))

      .map(e => e.line),
  )
}

function rebuildVisible(state: ClientState) {
  const filtered = state.entries.filter(
    e => !state.filter || matchFilter(state.filter, e.text),
  )
  state.log.setLogs(filtered.map(e => e.line))
}
