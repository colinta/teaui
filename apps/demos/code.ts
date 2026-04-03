import {Box, Stack, Tabs, Text, Style, Scrollable} from '@teaui/core'
import {CodeView} from '@teaui/code'

import {demo} from './demo.js'

const JS_CODE = `import React, {useState} from 'react'

function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div className="counter">
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
    </div>
  )
}

export default Counter`

const PYTHON_CODE = `import asyncio
from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float

    def distance(self, other: 'Point') -> float:
        return ((self.x - other.x) ** 2 + (self.y - other.y) ** 2) ** 0.5

async def main():
    points = [Point(0, 0), Point(3, 4), Point(1, 1)]
    for i, p in enumerate(points[:-1]):
        dist = p.distance(points[i + 1])
        print(f"{p} -> {points[i + 1]}: {dist:.2f}")

asyncio.run(main())`

const SQL_CODE = `SELECT
    u.id,
    u.name,
    COUNT(o.id) AS order_count,
    SUM(o.total) AS total_spent
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.created_at >= '2024-01-01'
    AND u.active = true
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 0
ORDER BY total_spent DESC
LIMIT 20;`

const TS_CODE = `interface Config {
  host: string
  port: number
  debug?: boolean
}

class Server {
  private config: Config

  constructor(config: Config) {
    this.config = config
  }

  async start(): Promise<void> {
    const {host, port} = this.config
    console.info(\`Listening on \${host}:\${port}\`)
  }

  stop(): void {
    console.info('Server stopped')
  }
}

const server = new Server({host: 'localhost', port: 3000})
server.start()`

const jsView = new CodeView({
  code: JS_CODE,
  language: 'javascript',
  showLineNumbers: true,
})

const pythonView = new CodeView({
  code: PYTHON_CODE,
  language: 'python',
  showLineNumbers: true,
  highlightLines: [3, 4, 5],
})

const sqlView = new CodeView({
  code: SQL_CODE,
  language: 'sql',
  showLineNumbers: true,
})

const tsView = new CodeView({
  code: TS_CODE,
  language: 'typescript',
  showLineNumbers: true,
  highlightLines: [1, 2, 3, 4],
})

demo(
  Stack.down([
    new Text({
      text: ' Code Highlighting Demo',
      style: new Style({bold: true}),
    }),
    [
      'flex1',
      Tabs.create(
        [
          ['JavaScript', new Scrollable({child: jsView})],
          ['Python', new Scrollable({child: pythonView})],
          ['SQL', new Scrollable({child: sqlView})],
          ['TypeScript', new Scrollable({child: tsView})],
        ],
        {border: true},
      ),
    ],
  ]),
)
