import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 42
const HEIGHT = 18

export const tableExample: ComponentExample = {
  name: 'table',
  availability: 'both',
  description:
    'Generic data table with sorted text cells, row numbers, and selection; custom one-line rows use Core addRow()/removeRow() or React renderItem, not automatic column layout or sorting',
  props: [
    {
      name: 'data',
      type: 'TData[]',
      description:
        'Required row array; TData is the row type. Sorting copies the array; multi-selection tracks original item identities. Replace data with a new array in Core update() or React props',
      availability: 'both',
    },
    {
      name: 'columns',
      type: 'Column<TData>[]',
      description:
        'Required definitions: key and title are strings (key is not constrained to keyof TData); width is number | "auto" | `${number}%` (default auto), align is left | center | right (default left), sortable defaults to false. Percentages use space after markers, controls, and separators; fixed widths are kept and auto columns share the remainder',
      availability: 'both',
    },
    {
      name: 'format',
      type: '(key: string, row: TData) => string',
      description:
        'Required Core cell formatter, also used for numeric-aware localeCompare sorting of formatted strings. Custom addRow() views replace the whole row content after controls',
      availability: 'core',
    },
    {
      name: 'format',
      type: '(key: string, row: TData) => string',
      description:
        'Optional React cell formatter; omitted defaults to blank strings, not automatic field lookup. Also used for numeric-aware localeCompare sorting. Use format without renderItem for internally sorted cells',
      availability: 'react',
    },
    {
      name: 'renderItem',
      type: '(item: TData, index: number) => React.ReactNode',
      description:
        'Optional React custom row renderer; index is zero-based in the input data. Virtualizes a visible slice using selectedIndex and measured height. Each row is clipped to one line after controls; JSX is not laid out into columns or reordered by internal sorting. Keep custom data in display order',
      availability: 'react',
    },
    {
      name: 'selectedIndex',
      type: 'number',
      description:
        'Cursor index in displayed order, not the multi-selection set; defaults to 0. Arrow, Home/End, and page keys move it and scroll. Core has a clamping selectedIndex setter; React custom row virtualization uses the supplied index',
      availability: 'both',
    },
    {
      name: 'onSelect',
      type: '(row: TData, index: number) => void',
      description:
        'Enter activates the cursor row; clicking a data row activates it only when isSelectable is false. Index is zero-based in displayed order',
      availability: 'both',
    },
    {
      name: 'onSort',
      type: '(key: string, direction: SortDirection) => void',
      description:
        'Notification after a header click changes internal sorting; not fired for initial props or update(). SortDirection is asc | desc; clicking the row-number header reports key "#" for original input order',
      availability: 'both',
    },
    {
      name: 'sortKey',
      type: 'string',
      description:
        'Initial sort field; use a matching sortable column. Sortable enables header clicks. Omitted preserves input order (or reverses it for desc); use formatted-cell mode for internal sorting',
      availability: 'both',
    },
    {
      name: 'sortDirection',
      type: "'asc' | 'desc'",
      description:
        'Initial direction defaults to asc; sortable header clicks toggle direction. In Core update(), pass sortKey and sortDirection together to re-sort existing data and retain inherited sizing props (View.update replaces them)',
      availability: 'both',
    },
    {
      name: 'showRowNumbers',
      type: 'boolean',
      description:
        'Defaults to false; shows one-based displayed row numbers, not original array indices. Clicking its # header restores or reverses input order',
      availability: 'both',
    },
    {
      name: 'isSelectable',
      type: 'boolean',
      description:
        'Defaults to false; enables multi-selection via Space or mouse drag/click. When showSelected is omitted, checkboxes follow this flag',
      availability: 'both',
    },
    {
      name: 'showSelected',
      type: 'boolean',
      description:
        'Checkbox-column visibility; defaults to isSelectable. False hides checkboxes without disabling selection. True alone shows controls but does not enable row toggling: also set isSelectable',
      availability: 'both',
    },
    {
      name: 'onSelectionChange',
      type: '(selectedItems: Set<TData>) => void',
      description:
        'Receives a new Set of selected original item identities when selection changes; independent of selectedIndex and onSelect',
      availability: 'both',
    },
    {
      name: 'childOffset',
      type: 'number',
      description:
        'Core custom rows only; defaults to 0. Data index represented by the first addRow() view. React manages this internally for renderItem and does not expose it as a wrapper prop',
      availability: 'core',
    },
    {
      name: 'width',
      type: "number | 'fill' | 'shrink' | 'natural'",
      description:
        'Inherited width in terminal columns, including markers, checkboxes, numbers, and separators. Table naturally fills available space',
      availability: 'both',
    },
    {
      name: 'height',
      type: "number | 'fill' | 'shrink' | 'natural'",
      description:
        'Inherited height in terminal rows, including two header/separator lines. Constrain the parent of a React renderItem table to size its measuring Geometry wrapper',
      availability: 'both',
    },
  ],
  source: {
    core: () => readExampleSource('table.core.js'),
    react: () => readExampleSource('table.react.tsx'),
  },
  render: {
    core: () => renderSample('table.core.js'),
    react: () => renderSample('table.react.tsx'),
  },
}

function readExampleSource(filename: string): string {
  return readFileSync(
    new URL(`./${filename}`, import.meta.url),
    'utf8',
  ).trimEnd()
}

function renderSample(filename: string): Promise<string> {
  return captureExample(new URL(`./${filename}`, import.meta.url), {
    width: WIDTH,
    height: HEIGHT,
  })
}
