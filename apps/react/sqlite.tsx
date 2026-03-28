import React, {useState, useMemo} from 'react'
import {DatabaseSync} from 'node:sqlite'
import {
  Accordion,
  Box,
  Button,
  Scrollable,
  Separator,
  Stack,
  Style,
  Text,
  run,
} from '@teaui/react'

// --- SQLite Adapter ---

interface ColumnInfo {
  cid: number
  name: string
  type: string
  notnull: number
  dflt_value: string | null
  pk: number
}

type TableSchema = [string, ColumnInfo[]]

function loadSchema(db: DatabaseSync): TableSchema[] {
  return db
    .prepare("SELECT name FROM sqlite_master WHERE type == 'table'")
    .all()
    .map(({name}: any) => [
      name,
      db.prepare(`PRAGMA table_info(${name})`).all() as ColumnInfo[],
    ])
}

function formatValue(value: unknown, type: string): string {
  if (value === null || value === undefined) return 'NULL'
  const upperType = type.toUpperCase()
  if (upperType.includes('BOOL')) {
    return value ? 'true' : 'false'
  }
  if (
    upperType.includes('INT') ||
    upperType.includes('REAL') ||
    upperType.includes('NUMERIC')
  ) {
    return String(value)
  }
  // text / blob / anything else
  return String(value)
}

function loadRows(
  db: DatabaseSync,
  tableName: string,
  columns: ColumnInfo[],
): string[] {
  const rows = db.prepare(`SELECT * FROM "${tableName}"`).all() as Record<
    string,
    unknown
  >[]
  return rows.map((row, i) => {
    const cells = columns.map(col => formatValue(row[col.name], col.type))
    return `${i + 1}. ${cells.join(' | ')}`
  })
}

// --- App ---

const [dbPath] = process.argv.slice(2)
if (!dbPath) {
  console.error('Usage: node sqlite.js <path-to-sqlite-db>')
  process.exit(1)
}

const db = new DatabaseSync(dbPath, {readOnly: true})
const schema = loadSchema(db)

function BrowseAnything() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null)

  const selectedSchema = useMemo(
    () => schema.find(([name]) => name === selectedTable),
    [selectedTable],
  )

  const rows = useMemo(() => {
    if (!selectedTable || !selectedSchema) return []
    return loadRows(db, selectedTable, selectedSchema[1])
  }, [selectedTable, selectedSchema])

  const header = useMemo(() => {
    if (!selectedSchema) return ''
    return selectedSchema[1].map(col => col.name).join(' | ')
  }, [selectedSchema])

  return (
    <Stack.right>
      <Accordion multiple width={30}>
        <Accordion.Section title="Tables" isOpen>
          <Stack.down>
            {schema.map(([name]) => (
              <Button
                key={name}
                title={name}
                onClick={() => setSelectedTable(name)}
                border={selectedTable === name ? 'default' : 'none'}
              />
            ))}
          </Stack.down>
        </Accordion.Section>
      </Accordion>
      <Separator.vertical />
      <Box flex={1}>
        {selectedTable ? (
          <Stack.down flex={1}>
            <Style bold>
              <Text>
                {selectedTable} ({rows.length} rows)
              </Text>
            </Style>
            <Style underline>
              <Text>{header}</Text>
            </Style>
            <Scrollable.down flex={1}>
              {rows.map((row, i) => (
                <Text key={i}>{row}</Text>
              ))}
            </Scrollable.down>
          </Stack.down>
        ) : (
          <Text>Select a table from the left panel</Text>
        )}
      </Box>
    </Stack.right>
  )
}

run(<BrowseAnything />)
