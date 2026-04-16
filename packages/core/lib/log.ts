import {ConsoleLog} from './components/Log.js'
import {inspect} from '@teaui/inspect'
import {removeAnsi} from '@teaui/term'

const levels = ['debug', 'error', 'info', 'log', 'warn'] as const
export type Level = (typeof levels)[number]
export type Listener = (level: Level, args: any[]) => void
export interface LogLine {
  level: Level
  args: any[]
}
let logs: LogLine[] = []

const builtin: any = {}
levels.forEach(level => {
  builtin[level] = console[level]
})

export function interceptConsoleLog(logListener: Listener = appendLog) {
  levels.forEach(level => {
    console[level] = function (...args) {
      logListener(level, args)
    }
  })

  process.on('exit', code => {
    flushLogs()
  })
}

export function decorateConsoleLog() {
  levels.forEach(level => {
    const log = console[level]
    if ((log as any).isDecorated) {
      return
    }
    ;(log as any).isDecorated = true

    console[level] = function (...args) {
      log(...args.map(arg => inspect(arg, true)))
    }
  })
}

export type LogListener = (log: LogLine) => void
const logListeners = new Set<LogListener>()

export function addListener(listener: LogListener) {
  logListeners.add(listener)
}

export function removeListener(listener: LogListener) {
  logListeners.delete(listener)
}

function appendLog(level: Level, args: any[]) {
  logs.push({
    level,
    args: args.map(arg =>
      typeof arg === 'string'
        ? inspect(removeAnsi(arg), true)
        : inspect(arg, true),
    ),
  })
  const logLine = logs[logs.length - 1]
  for (const listener of logListeners) {
    listener(logLine)
  }
}

/**
 * Doesn't report 'console.debug' (I don't remember why). Clears logs, but keeps
 * console.debug.
 */
export function fetchLogs() {
  const copy = logs.filter(({level}) => level !== 'debug')
  logs = logs.filter(({level}) => level === 'debug')
  return copy
}

export function flushLogs() {
  logs.forEach(({level, args}) => {
    builtin[level].apply(console, args)
  })
  logs.splice(0, logs.length)
  levels.forEach(level => {
    console[level] = builtin[level]
  })
}
