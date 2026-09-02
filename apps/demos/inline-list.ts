import {
  type KeyEvent,
  type Viewport,
  Screen,
  Table,
  Window,
  isKeyPrintable,
} from '@teaui/core'

interface TestCase {
  name: string
  target: string
}

const INLINE_HEIGHT = 9
const SMOKE_TEST_DELAY_MS = 100

class InlineList extends Table<TestCase> {
  #query = ''
  #dimensions = ''

  constructor() {
    super({
      data: TEST_CASES,
      columns: columnsForQuery('', ''),
      format: (key, row) => row[key as keyof TestCase],
      isSelectable: true,
      showSelected: true,
      showRowNumbers: true,
      sortKey: 'name',
    })
  }

  receiveKey(event: KeyEvent): void {
    if (event.name === 'escape') {
      this.#query = ''
      this.#refreshFilter()
      return
    }

    if (event.name === 'backspace') {
      this.#query = this.#query.slice(0, -1)
      this.#refreshFilter()
      return
    }

    if (event.name === 'space') {
      super.receiveKey(event)
      return
    }

    if (isKeyPrintable(event)) {
      this.#query += event.char
      this.#refreshFilter()
      return
    }

    super.receiveKey(event)
  }

  receivePaste(text: string): void {
    this.#query += text.replaceAll(/\s+/g, ' ')
    this.#refreshFilter()
  }

  override render(viewport: Viewport): void {
    const dimensions = `${INLINE_HEIGHT}→${viewport.contentSize.height} rows · ${viewport.contentSize.width} cols`
    if (dimensions !== this.#dimensions) {
      this.#dimensions = dimensions
      this.update({columns: columnsForQuery(this.#query, dimensions)})
    }
    super.render(viewport)
  }

  #refreshFilter(): void {
    const query = this.#query.toLowerCase()
    const data = TEST_CASES.filter(
      item =>
        item.name.toLowerCase().includes(query) ||
        item.target.toLowerCase().includes(query),
    )
    this.update({
      data,
      columns: columnsForQuery(this.#query, this.#dimensions),
      selectedIndex: 0,
    })
  }
}

function columnsForQuery(query: string, dimensions: string) {
  const filter = query ? `filter: ${query}` : 'type to filter'
  const status = dimensions ? `${dimensions} · ` : ''
  return [
    {
      key: 'name',
      title: `${status}${filter}`,
      width: 'auto' as const,
      sortable: true,
    },
    {
      key: 'target',
      title: 'UAT target',
      width: 28,
    },
  ]
}

const TEST_CASES: TestCase[] = [
  {name: 'Keyboard navigation', target: 'Up/down selection'},
  {name: 'Text filtering', target: 'Printable input'},
  {name: 'Paste filtering', target: 'Bracketed paste'},
  {name: 'Clear filter', target: 'Escape key'},
  {name: 'Edit filter', target: 'Backspace key'},
  {name: 'Mouse selection', target: 'Click a row'},
  {name: 'Multi-selection', target: 'Space key'},
  {name: 'Drag selection', target: 'Click and drag rows'},
  {name: 'Wheel down', target: 'Scroll lower'},
  {name: 'Wheel up', target: 'Scroll higher'},
  {name: 'Header sorting', target: 'Click Name header'},
  {name: 'Terminal history', target: 'Text above remains'},
  {name: 'Inline height', target: 'Exactly 9 lines'},
  {name: 'Terminal width', target: 'Full current width'},
  {name: 'Resize smaller', target: 'Effective rows shrink'},
  {name: 'Resize larger', target: 'Configured rows return'},
  {name: 'Mouse origin', target: 'Correct clicked row'},
  {name: 'Mouse clipping', target: 'Ignore outside region'},
  {name: 'Focus events', target: 'Switch terminal focus'},
  {name: 'Normal exit', target: 'Ctrl-C cleanup'},
  {name: 'Region cleanup', target: 'Only list is erased'},
  {name: 'Cursor placement', target: 'Shell starts at region'},
]

const preserveFrame = process.argv.includes('--preserve')
const repeatStop = process.argv.includes('--repeat-stop')

process.stdout.write(
  [
    'TeaUI inline-mode UAT',
    `The ${INLINE_HEIGHT}-line list below should leave this text visible. Its header shows configured→effective rows and current columns.`,
    'Try typing/pasting, Backspace/Escape, ↑/↓, wheel scrolling, clicks, and click-dragging.',
    `Resize shorter than ${INLINE_HEIGHT} rows, then grow again. Ctrl-C exits and ${preserveFrame ? 'preserves the final frame' : 'clears only the list'}.`,
  ].join('\n') + '\n',
)

const [screen] = await Screen.start(new Window({child: new InlineList()}), {
  quitChar: 'C-c',
  display: {
    mode: 'inline',
    height: INLINE_HEIGHT,
    clearOnExit: !preserveFrame,
  },
})

if (repeatStop) {
  setTimeout(() => {
    screen.stop()
    screen.stop()
    process.stdout.write(
      'Repeated stop completed; terminal input is restored.\n',
    )
  }, SMOKE_TEST_DELAY_MS)
} else if (process.argv.includes('--exit')) {
  setTimeout(() => screen.exit(), SMOKE_TEST_DELAY_MS)
}
