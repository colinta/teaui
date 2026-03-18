import React, {useState, useCallback} from 'react'
import {interceptConsoleLog, type Column, type SortDirection} from '@teaui/core'
import {Box, Stack, Style, Table, Text, run} from '@teaui/react'

interceptConsoleLog()

interface Person {
  name: string
  age: number
  email: string
  status: string
  city: string
}

const DATA: Person[] = [
  {
    name: 'Alice',
    age: 30,
    email: 'alice@example.com',
    status: 'Active',
    city: 'New York',
  },
  {
    name: 'Bob',
    age: 25,
    email: 'bob@example.com',
    status: 'Pending',
    city: 'San Francisco',
  },
  {
    name: 'Charlie',
    age: 35,
    email: 'charlie@ex.com',
    status: 'Active',
    city: 'Chicago',
  },
  {
    name: 'Diana',
    age: 28,
    email: 'diana@example.com',
    status: 'Inactive',
    city: 'Austin',
  },
  {
    name: 'Eve',
    age: 42,
    email: 'eve@example.com',
    status: 'Active',
    city: 'Seattle',
  },
  {
    name: 'Frank',
    age: 31,
    email: 'frank@example.com',
    status: 'Pending',
    city: 'Denver',
  },
  {
    name: 'Grace',
    age: 27,
    email: 'grace@example.com',
    status: 'Active',
    city: 'Portland',
  },
  {
    name: 'Hank',
    age: 55,
    email: 'hank@example.com',
    status: 'Inactive',
    city: 'Miami',
  },
  {
    name: 'Irene',
    age: 33,
    email: 'irene@example.com',
    status: 'Active',
    city: 'Boston',
  },
  {
    name: 'Jack',
    age: 29,
    email: 'jack@example.com',
    status: 'Pending',
    city: 'Nashville',
  },
  {
    name: 'Karen',
    age: 38,
    email: 'karen@example.com',
    status: 'Active',
    city: 'Atlanta',
  },
  {
    name: 'Leo',
    age: 44,
    email: 'leo@example.com',
    status: 'Active',
    city: 'Phoenix',
  },
  {
    name: 'Mona',
    age: 26,
    email: 'mona@example.com',
    status: 'Inactive',
    city: 'Dallas',
  },
  {
    name: 'Nate',
    age: 50,
    email: 'nate@example.com',
    status: 'Active',
    city: 'Detroit',
  },
  {
    name: 'Olivia',
    age: 23,
    email: 'olivia@example.com',
    status: 'Pending',
    city: 'Minneapolis',
  },
  {
    name: 'Paul',
    age: 37,
    email: 'paul@example.com',
    status: 'Active',
    city: 'Philadelphia',
  },
  {
    name: 'Quinn',
    age: 41,
    email: 'quinn@example.com',
    status: 'Active',
    city: 'San Diego',
  },
  {
    name: 'Rita',
    age: 34,
    email: 'rita@example.com',
    status: 'Inactive',
    city: 'Houston',
  },
  {
    name: 'Sam',
    age: 46,
    email: 'sam@example.com',
    status: 'Active',
    city: 'Orlando',
  },
  {
    name: 'Tina',
    age: 32,
    email: 'tina@example.com',
    status: 'Pending',
    city: 'Las Vegas',
  },
  {
    name: 'Uma',
    age: 39,
    email: 'uma@example.com',
    status: 'Active',
    city: 'Charlotte',
  },
  {
    name: 'Vince',
    age: 48,
    email: 'vince@example.com',
    status: 'Active',
    city: 'Columbus',
  },
  {
    name: 'Wendy',
    age: 22,
    email: 'wendy@example.com',
    status: 'Inactive',
    city: 'Indianapolis',
  },
  {
    name: 'Xander',
    age: 36,
    email: 'xander@example.com',
    status: 'Active',
    city: 'Memphis',
  },
  {
    name: 'Yara',
    age: 29,
    email: 'yara@example.com',
    status: 'Pending',
    city: 'Louisville',
  },
  {
    name: 'Zane',
    age: 53,
    email: 'zane@example.com',
    status: 'Active',
    city: 'Baltimore',
  },
]

const COLUMNS: Column<Person>[] = [
  {key: 'name', title: 'Name', width: 12, sortable: true},
  {key: 'age', title: 'Age', width: 6, align: 'right', sortable: true},
  {key: 'email', title: 'Email'},
  {key: 'status', title: 'Status', width: 10, sortable: true},
  {key: 'city', title: 'City', sortable: true},
]

function StatusBadge({status}: {status: string}) {
  const color =
    status === 'Active' ? 'green' : status === 'Pending' ? 'yellow' : 'red'
  return (
    <Style foreground={color} bold>
      ● {status}
    </Style>
  )
}

function App() {
  const [sortKey, setSortKey] = useState('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selected, setSelected] = useState<Person | null>(null)
  const [showRowNumbers, setShowRowNumbers] = useState(true)

  const handleSort = useCallback((key: string, direction: SortDirection) => {
    setSortKey(key)
    setSortDirection(direction)
  }, [])

  const handleSelect = useCallback((row: Person, _index: number) => {
    setSelected(row)
  }, [])

  const format = useCallback((key: string, row: Person) => {
    return String(row[key as keyof Person])
  }, [])

  return (
    <Box border="rounded" flex={1}>
      <Stack.down flex={1}>
        <Text alignment="center">
          <Style bold foreground="cyan">
            ☕ TeaUI Table Demo
          </Style>
        </Text>
        <Stack.right gap={1} padding={1}>
          <Text>
            <Style dim>
              Sort: {sortKey} {sortDirection === 'asc' ? '▲' : '▼'}
            </Style>
          </Text>
          <Text>
            <Style dim>│</Style>
          </Text>
          <Text>
            <Style dim>Selected: {selected ? selected.name : '(none)'}</Style>
          </Text>
          <Text>
            <Style dim>│</Style>
          </Text>
          <Text>
            <Style dim>{DATA.length} rows</Style>
          </Text>
          {selected ? (
            <>
              <Text>
                <Style dim>│</Style>
              </Text>
              <StatusBadge status={selected.status} />
            </>
          ) : null}
        </Stack.right>
        <Table
          data={DATA}
          columns={COLUMNS}
          format={format}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSelect={handleSelect}
          onSort={handleSort}
          showRowNumbers
          flex={1}
        />
      </Stack.down>
    </Box>
  )
}

run(<App />)
