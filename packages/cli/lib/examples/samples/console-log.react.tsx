import React from 'react'
import {interceptConsoleLog} from '@teaui/core'
import {ConsoleLog, run} from '@teaui/react'

interceptConsoleLog()
console.log('Application ready')
console.info('Server started')
console.warn('Slow connection')
console.error('Retry needed', 'Check the network')

await run(<ConsoleLog width={36} height={5} />)
