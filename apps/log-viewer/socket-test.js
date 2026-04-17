import net from 'node:net'

const SOCK = '/tmp/teaui-log-viewer.sock'

const client = net.createConnection(SOCK, () => {
  console.log('connected')

  client.write(JSON.stringify({type: 'register', name: 'socket-test'}) + '\n')

  let i = 0
  const interval = setInterval(() => {
    const msg =
      JSON.stringify({
        type: 'log',
        metadata: {level: 'info', source: 'test'},
        message: `test message ${++i}`,
      }) + '\n'
    console.log('sending:', msg.trim())
    client.write(msg)
  }, 500)

  setTimeout(() => {
    clearInterval(interval)
    client.end()
    console.log('done')
  }, 5000)
})

client.on('error', err => {
  console.error('error:', err.message)
})
