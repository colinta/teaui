import {describe, it, expect} from 'vitest'
import {testRender} from '@teaui/core'
import {CodeView} from '../lib/CodeView.js'

const JS_CODE = `const x = 1
if (x > 0) {
  console.log("hello")
}`

const SHORT_CODE = `let a = 42`

describe('CodeView', () => {
  it('renders code', () => {
    const t = testRender(
      new CodeView({code: JS_CODE, language: 'javascript'}),
      {
        width: 40,
        height: 6,
      },
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders with explicit language', () => {
    const t = testRender(
      new CodeView({code: 'SELECT * FROM users', language: 'sql'}),
      {width: 30, height: 3},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders with auto-detected language', () => {
    const t = testRender(new CodeView({code: JS_CODE}), {
      width: 40,
      height: 6,
    })
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders with line numbers', () => {
    const t = testRender(
      new CodeView({
        code: JS_CODE,
        language: 'javascript',
        showLineNumbers: true,
      }),
      {width: 40, height: 6},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders with highlighted lines', () => {
    const t = testRender(
      new CodeView({
        code: JS_CODE,
        language: 'javascript',
        showLineNumbers: true,
        highlightLines: [2],
      }),
      {width: 40, height: 6},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders empty code', () => {
    const t = testRender(new CodeView({code: ''}), {width: 20, height: 3})
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders single line', () => {
    const t = testRender(
      new CodeView({code: SHORT_CODE, language: 'javascript'}),
      {width: 20, height: 1},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('wraps long lines when wrap is enabled', () => {
    const longLine = 'const veryLongVariableName = "a very long string value"'
    const t = testRender(
      new CodeView({code: longLine, language: 'javascript', wrap: true}),
      {width: 20, height: 5},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('truncates long lines when wrap is disabled', () => {
    const longLine = 'const veryLongVariableName = "a very long string value"'
    const t = testRender(
      new CodeView({code: longLine, language: 'javascript'}),
      {width: 20, height: 1},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders line numbers with correct gutter width for many lines', () => {
    const lines = Array.from({length: 100}, (_, i) => `line ${i + 1}`).join(
      '\n',
    )
    const t = testRender(new CodeView({code: lines, showLineNumbers: true}), {
      width: 30,
      height: 5,
    })
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders python code', () => {
    const code = `def greet(name):
    print(f"Hello, {name}")

greet("world")`
    const t = testRender(new CodeView({code, language: 'python'}), {
      width: 40,
      height: 5,
    })
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders with line numbers and wrap', () => {
    const longLine = 'const x = "a really long string that should wrap around"'
    const t = testRender(
      new CodeView({
        code: longLine,
        language: 'javascript',
        showLineNumbers: true,
        wrap: true,
      }),
      {width: 25, height: 5},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })
})
