import React from 'react'
import {Table} from '@teaui/react'

interface Person {
  name: string
  age: number
  role: string
}

const data: Person[] = [
  {name: 'Alice', age: 30, role: 'Engineer'},
  {name: 'Bob', age: 25, role: 'Designer'},
  {name: 'Charlie', age: 35, role: 'Manager'},
]

function App() {
  return (
    <Table
      data={data}
      columns={[
        {key: 'name', title: 'Name', sortable: true},
        {key: 'age', title: 'Age', width: 5, align: 'right'},
        {key: 'role', title: 'Role'},
      ]}
      format={(key, row) => String(row[key as keyof Person])}
      selectedIndex={1}
      sortKey="name"
    />
  )
}

export default {width: 40, height: 6, title: 'Table', App}
