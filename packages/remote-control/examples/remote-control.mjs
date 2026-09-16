// Usage: node packages/remote-control/examples/remote-control.mjs /path/to/endpoint.json < events.jsonl
// Each stdin line is a TeaUI SystemEvent or {"type":"snapshot","format":"plain"} request.
import {readFileSync} from 'node:fs'
import {once} from 'node:events'
import {createInterface} from 'node:readline'
import {WebSocket} from 'ws'

const endpointFile = process.argv[2]
if (!endpointFile) {
  console.error(
    'Usage: node remote-control.mjs /path/to/endpoint.json < events.jsonl',
  )
  process.exit(1)
}

const {url} = JSON.parse(readFileSync(endpointFile, 'utf8'))
const socket = new WebSocket(url)
socket.on('error', () => {}) // Individual connect/send operations report errors.
socket.on('message', data => {
  const message = JSON.parse(data.toString())
  if (message.type === 'snapshot' && message.sequence === undefined) {
    console.log(JSON.stringify(message))
  }
})
let lines
let sequence = 0

function send(event) {
  const expectedSequence = ++sequence
  return new Promise((resolve, reject) => {
    if (socket.readyState !== WebSocket.OPEN) {
      reject(new Error('Remote control connection is closed'))
      return
    }
    const cleanup = () => {
      clearTimeout(timer)
      socket.off('message', onMessage)
      socket.off('close', onClose)
      socket.off('error', onError)
    }
    const onMessage = data => {
      try {
        const reply = JSON.parse(data.toString())
        // Application broadcasts are printed above, but cannot satisfy a request.
        if (reply.sequence !== expectedSequence) return
        cleanup()
        if (reply.type === 'error') reject(new Error(reply.message))
        else resolve(reply)
      } catch (error) {
        cleanup()
        reject(error)
      }
    }
    const onError = error => {
      cleanup()
      reject(error)
    }
    const onClose = () =>
      onError(
        new Error('Screen closed before replying (expected for quit events)'),
      )
    const timer = setTimeout(
      () => onError(new Error('No reply within 30 seconds')),
      30_000,
    )
    socket.on('message', onMessage)
    socket.once('close', onClose)
    socket.once('error', onError)
    socket.send(JSON.stringify(event))
  })
}

try {
  await once(socket, 'open', {signal: AbortSignal.timeout(5000)})
  lines = createInterface({input: process.stdin, crlfDelay: Infinity})
  // One request in flight. ACK confirms synchronous dispatch/render, not React
  // effects or async application work. Check application state before assertions.
  for await (const line of lines) {
    if (!line.trim()) continue
    console.log(JSON.stringify(await send(JSON.parse(line))))
  }
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  lines?.close()
  socket.terminate()
}
