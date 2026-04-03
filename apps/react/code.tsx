import React, {useState} from 'react'
import {interceptConsoleLog} from '@teaui/core'
import {
  Box,
  Dropdown,
  Input,
  Scrollable,
  Stack,
  Style,
  Tabs,
  Text,
  run,
} from '@teaui/react'
import {Code} from '@teaui/code/react'

// ── Sample Code ──────────────────────────────────────────────────────────────

const SAMPLES: Record<string, {language: string; code: string}> = {
  JavaScript: {
    language: 'javascript',
    code: `import React, {useState} from 'react'

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

export default Counter`,
  },
  Python: {
    language: 'python',
    code: `import asyncio
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

asyncio.run(main())`,
  },
  SQL: {
    language: 'sql',
    code: `SELECT
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
LIMIT 20;`,
  },
  TypeScript: {
    language: 'typescript',
    code: `interface Config {
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
server.start()`,
  },
}

const LANGUAGE_NAMES = Object.keys(SAMPLES)

// ── Code Tab ─────────────────────────────────────────────────────────────────

export function CodeTab() {
  const [selected, setSelected] = useState(0)
  const sample = SAMPLES[LANGUAGE_NAMES[selected]]

  return (
    <Stack.down gap={1} flex={1}>
      <Text>
        <Style bold foreground="cyan">
          Code Highlighting
        </Style>
        {' — Syntax-highlighted code viewer'}
      </Text>
      <Stack.right gap={1} pin="horizontal">
        <Text>
          <Style bold>Language:</Style>
        </Text>
        <Dropdown
          choices={LANGUAGE_NAMES.map((name, i) => [name, i])}
          selected={selected}
          onSelect={setSelected}
        />
      </Stack.right>
      <Box border="rounded" flex={1}>
        <Scrollable flex={1}>
          <Code
            code={sample.code}
            language={sample.language}
            showLineNumbers
            flex={1}
          />
        </Scrollable>
      </Box>
    </Stack.down>
  )
}

// ── Standalone ───────────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  interceptConsoleLog()

  run(<CodeTab />)
}
