import {Log, Screen} from '@teaui/core'

const log = new Log()
log.setLogs([
  {level: 'info', args: ['Server started']},
  {level: 'warn', args: ['Slow connection']},
  {level: 'error', args: ['Retry needed\nCheck the network']},
])

await Screen.start(log)
