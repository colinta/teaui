// A separate Node process driving a TeaUI screen, using the public wire format.
import {once} from 'node:events'
import {WebSocket} from 'ws'

const socket = new WebSocket(process.argv[2])
const timeout = setTimeout(() => {
  socket.terminate()
  process.exit(1)
}, 5000)

try {
  await once(socket, 'open')
  for (const event of JSON.parse(process.argv[3])) {
    const reply = once(socket, 'message')
    socket.send(JSON.stringify(event))
    const [data] = await reply
    const response = JSON.parse(data.toString())
    const expected = event.type === 'snapshot' ? 'snapshot' : 'ack'
    if (response.type !== expected) {
      throw new Error(JSON.stringify(response))
    }
    console.log(JSON.stringify(response))
  }
  const closed = once(socket, 'close')
  socket.close()
  await closed
} finally {
  clearTimeout(timeout)
  socket.terminate()
}
