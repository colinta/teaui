import {ConsoleLog, Screen, Window, interceptConsoleLog} from '@teaui/core'

interceptConsoleLog()
console.log('Application ready')
console.info('Server started')
console.warn('Slow connection')
console.error('Retry needed', 'Check the network')

await Screen.start(new Window({child: new ConsoleLog({width: 36, height: 5})}))
