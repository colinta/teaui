import {Screen} from '@teaui/core'
import {Code} from '@teaui/code'

const SOURCE = [
  "const message = 'Syntax-highlighted code can wrap too.'",
  'function greet(name) {',
  '  return `Hello, ${name}!`',
  '}',
  "greet('TeaUI')",
].join('\n')

const code = new Code({
  code: SOURCE,
  language: 'javascript',
  showLineNumbers: true,
  highlightLines: [2],
  wrap: true,
  width: 40,
  height: 7,
})

await Screen.start(code)
