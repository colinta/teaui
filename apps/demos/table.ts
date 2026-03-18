import {interceptConsoleLog, Table, type Column} from '@teaui/core'
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

const columns: Column<Person>[] = [
  {key: 'name', title: 'Name', width: 12},
  {key: 'age', title: 'Age', width: 6, align: 'right'},
  {key: 'email', title: 'Email'},
  {key: 'status', title: 'Status', width: 10},
  {key: 'city', title: 'City'},
]

let sortKey = 'name'
let sortDirection: 'asc' | 'desc' = 'asc'
let sortedData = [...data]

function sortData() {
  sortedData = [...data].sort((a, b) => {
    const aVal = a[sortKey as keyof Person]
    const bVal = b[sortKey as keyof Person]
    const cmp = String(aVal).localeCompare(String(bVal), undefined, {
      numeric: true,
    })
    return sortDirection === 'asc' ? cmp : -cmp
  })
}

sortData()

const table = new Table<Person>({
  data: sortedData,
  columns,
  format(key, row) {
    return String(row[key as keyof Person])
  },
  sortKey,
  sortDirection,
  onSelect(row, index) {
    console.log(`Selected: ${row.name} (row ${index})`)
  },
  onSort(key, direction) {
    sortKey = key
    sortDirection = direction
    sortData()
    table.update({
      data: sortedData,
      columns,
      format(key, row) {
        return String(row[key as keyof Person])
      },
      sortKey,
      sortDirection,
    })
  },
})

demo(table)
