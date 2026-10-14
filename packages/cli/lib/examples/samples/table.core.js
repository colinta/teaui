import {Screen, Stack, Table, Text} from '@teaui/core'

const stock = [
  {name: 'Cherries', quantity: 30, status: 'Ready'},
  {name: 'Apples', quantity: 10, status: 'Packed'},
  {name: 'Bananas', quantity: 2, status: 'Ready'},
]
// Reserve a trailing header space for the right-aligned sort arrow.
const columns = [
  {key: 'name', title: 'Name', width: 'auto', sortable: true},
  {key: 'quantity', title: 'Qty ', width: 8, align: 'right', sortable: true},
  {key: 'status', title: 'Status', width: '30%', align: 'center'},
]
const format = (key, row) => String(row[key])

// Sorting uses formatted strings with numeric comparison: 2, 10, 30.
const quantities = new Table({
  width: 42,
  height: 5,
  data: stock,
  columns,
  format,
  sortKey: 'quantity',
  sortDirection: 'asc',
  selectedIndex: 1,
  showRowNumbers: true,
})
const names = new Table({
  width: 42,
  height: 5,
  data: stock,
  columns,
  format,
  sortKey: 'name',
  sortDirection: 'asc',
  isSelectable: true,
  showSelected: true,
})

// Custom views replace the cells, remain in input order, and occupy one line.
// Use addRow(), not Container.add(); Table owns its implementation children.
const custom = new Table({
  width: 42,
  height: 5,
  data: stock,
  columns: [{key: 'name', title: 'Stock summary', width: 'auto'}],
  format,
  selectedIndex: 2,
  showRowNumbers: true,
})
stock.forEach((row, index) => {
  custom.addRow(new Text(`${index + 1}: ${row.name} (${row.quantity} units)`))
})

const examples = Stack.down({
  width: 42,
  height: 18,
  children: [
    new Text('Text cells: quantity ascending'),
    quantities,
    new Text('Text cells: name descending + selection'),
    names,
    new Text('Custom rows: input order'),
    custom,
  ],
})

const [screen] = await Screen.start(examples)

// Pass both sort fields to re-sort; retain inherited sizing in update().
names.update({width: 42, height: 5, sortKey: 'name', sortDirection: 'desc'})
names.selectedIndex = 1
screen.render()
