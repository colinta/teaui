import {
  interceptConsoleLog,
  Checkbox,
  Stack,
  Table,
  type Column,
} from '@teaui/core'
import {demo} from './demo.js'

interceptConsoleLog()

interface Person {
  name: string
  age: number
  email: string
  status: string
  city: string
}

const data: Person[] = [
  {
    name: 'Eve',
    age: 42,
    email: 'eve@example.com',
    status: 'Active',
    city: 'Seattle',
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
    name: 'Irene',
    age: 33,
    email: 'irene@example.com',
    status: 'Active',
    city: 'Boston',
  },
  {
    name: 'Zane',
    age: 53,
    email: 'zane@example.com',
    status: 'Active',
    city: 'Baltimore',
  },
  {
    name: 'Frank',
    age: 31,
    email: 'frank@example.com',
    status: 'Pending',
    city: 'Denver',
  },
  {
    name: 'Yara',
    age: 29,
    email: 'yara@example.com',
    status: 'Pending',
    city: 'Louisville',
  },
  {
    name: 'Grace',
    age: 27,
    email: 'grace@example.com',
    status: 'Active',
    city: 'Portland',
  },
  {
    name: 'Sam',
    age: 46,
    email: 'sam@example.com',
    status: 'Active',
    city: 'Orlando',
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
    name: 'Alice',
    age: 30,
    email: 'alice@example.com',
    status: 'Active',
    city: 'New York',
  },
  {
    name: 'Nate',
    age: 50,
    email: 'nate@example.com',
    status: 'Active',
    city: 'Detroit',
  },
  {
    name: 'Hank',
    age: 55,
    email: 'hank@example.com',
    status: 'Inactive',
    city: 'Miami',
  },
  {
    name: 'Wendy',
    age: 22,
    email: 'wendy@example.com',
    status: 'Inactive',
    city: 'Indianapolis',
  },
  {
    name: 'Leo',
    age: 44,
    email: 'leo@example.com',
    status: 'Active',
    city: 'Phoenix',
  },
  {
    name: 'Uma',
    age: 39,
    email: 'uma@example.com',
    status: 'Active',
    city: 'Charlotte',
  },
  {
    name: 'Rita',
    age: 34,
    email: 'rita@example.com',
    status: 'Inactive',
    city: 'Houston',
  },
  {
    name: 'Mona',
    age: 26,
    email: 'mona@example.com',
    status: 'Inactive',
    city: 'Dallas',
  },
  {
    name: 'Bob',
    age: 25,
    email: 'bob@example.com',
    status: 'Pending',
    city: 'San Francisco',
  },
  {
    name: 'Xander',
    age: 36,
    email: 'xander@example.com',
    status: 'Active',
    city: 'Memphis',
  },
  {
    name: 'Tina',
    age: 32,
    email: 'tina@example.com',
    status: 'Pending',
    city: 'Las Vegas',
  },
  {
    name: 'Quinn',
    age: 41,
    email: 'quinn@example.com',
    status: 'Active',
    city: 'San Diego',
  },
  {
    name: 'Vince',
    age: 48,
    email: 'vince@example.com',
    status: 'Active',
    city: 'Columbus',
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
]

const columns: Column<Person>[] = [
  {key: 'name', title: 'Name', width: 12, sortable: true},
  {key: 'age', title: 'Age', width: 6, align: 'right', sortable: true},
  {key: 'email', title: 'Email'},
  {key: 'status', title: 'Status', width: 10, sortable: true},
  {key: 'city', title: 'City', sortable: true},
]

const table = new Table<Person>({
  data,
  columns,
  format(key, row) {
    return String(row[key as keyof Person])
  },
  sortKey: 'name',
  sortDirection: 'asc',
  showRowNumbers: true,
  showSelected: true,
  onSelect(row, index) {
    console.log(`Selected: ${row.name} (row ${index})`)
  },
  onSort(key, direction) {
    console.log(`Sort changed: ${key} ${direction}`)
  },
  onSelectionChange(items) {
    console.log(
      `Selection: ${[...items].map(p => p.name).join(', ')} (${items.size})`,
    )
  },
})

const rowNumCheckbox = new Checkbox({
  title: 'Show row numbers',
  value: true,
  onChange(value) {
    table.update({showRowNumbers: value})
  },
})

const selectCheckbox = new Checkbox({
  title: 'Show checkboxes',
  value: true,
  onChange(value) {
    table.update({showSelected: value})
  },
})

demo(
  Stack.down({
    children: [
      Stack.right({gap: 2, children: [rowNumCheckbox, selectCheckbox]}),
      ['flex1', table],
    ],
  }),
)
