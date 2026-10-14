import React from 'react'
import {Stack, Table, Text, run, type ReactTableProps} from '@teaui/react'

interface Stock {
  name: string
  quantity: number
  status: string
}

const stock: Stock[] = [
  {name: 'Cherries', quantity: 30, status: 'Ready'},
  {name: 'Apples', quantity: 10, status: 'Packed'},
  {name: 'Bananas', quantity: 2, status: 'Ready'},
]
// Reserve a trailing header space for the right-aligned sort arrow.
const columns: ReactTableProps<Stock>['columns'] = [
  {key: 'name', title: 'Name', width: 'auto', sortable: true},
  {key: 'quantity', title: 'Qty ', width: 8, align: 'right', sortable: true},
  {key: 'status', title: 'Status', width: '30%', align: 'center'},
]
const format = (key: string, row: Stock): string =>
  String(row[key as keyof Stock])

// Use format without renderItem for internally sorted, aligned text cells.
// Custom JSX rows use input order, not internal sort order or column layout.
await run(
  <Stack.down width={42} height={18}>
    <Text>Text cells: quantity ascending</Text>
    <Table<Stock>
      width={42}
      height={5}
      data={stock}
      columns={columns}
      format={format}
      sortKey="quantity"
      sortDirection="asc"
      selectedIndex={1}
      showRowNumbers
    />
    <Text>Text cells: name descending + selection</Text>
    <Table<Stock>
      width={42}
      height={5}
      data={stock}
      columns={columns}
      format={format}
      sortKey="name"
      sortDirection="desc"
      selectedIndex={1}
      isSelectable
      showSelected
    />
    <Text>Custom rows: input order</Text>
    {/* Constrain the parent: renderItem uses a measuring Geometry wrapper. */}
    <Stack.down width={42} height={5}>
      <Table<Stock>
        data={stock}
        columns={[{key: 'name', title: 'Stock summary', width: 'auto'}]}
        selectedIndex={2}
        showRowNumbers
        renderItem={(row, index) => (
          <Text>{`${index + 1}: ${row.name} (${row.quantity} units)`}</Text>
        )}
      />
    </Stack.down>
  </Stack.down>,
)
