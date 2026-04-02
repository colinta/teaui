import {readdirSync, readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {join, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {renderToAnsi} from '@teaui/core'

import {renderReact} from '../screenshots/renderReact.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const EXAMPLES_DIR = join(__dirname, '..', 'examples')
const EXAMPLES_OUTPUT_DIR = join(__dirname, '..', 'static', 'examples')

// Zenburn 16-color palette
const COLORS_16: Record<number, string> = {
  0: '#303030',
  1: '#CC9393',
  2: '#7F9F7F',
  3: '#F0DFAF',
  4: '#8CD0D3',
  5: '#DC8CC3',
  6: '#93E0E3',
  7: '#DEDEDE',
  8: '#808080',
  9: '#DCA3A3',
  10: '#9AC39F',
  11: '#EFEF8F',
  12: '#8FBEDE',
  13: '#EC93D3',
  14: '#93E0E3',
  15: '#FFFFFF',
}

const DEFAULT_FG = '#DEDEDE'
const DEFAULT_BG = '#393939'

/**
 * Custom ANSI→HTML converter that supports 24-bit RGB colors (38;2;r;g;b),
 * 256-color (38;5;n), and standard 16-color codes.
 */
function ansiToHtml(ansi: string): string {
  let fg: string | null = null
  let bg: string | null = null
  let bold = false
  let dim = false
  let italic = false
  let underline = false
  let inverse = false

  let html = ''
  let spanOpen = false

  function openSpan() {
    const styles: string[] = []
    const effectiveFg = inverse ? (bg ?? DEFAULT_BG) : (fg ?? DEFAULT_FG)
    const effectiveBg = inverse ? (fg ?? DEFAULT_FG) : (bg ?? DEFAULT_BG)

    if (effectiveFg !== DEFAULT_FG) styles.push(`color:${effectiveFg}`)
    if (effectiveBg !== DEFAULT_BG)
      styles.push(`background-color:${effectiveBg}`)
    if (bold) styles.push('font-weight:bold')
    if (dim) styles.push('opacity:0.7')
    if (italic) styles.push('font-style:italic')
    if (underline) styles.push('text-decoration:underline')

    if (styles.length > 0) {
      html += `<span style="${styles.join(';')}">`
      spanOpen = true
    }
  }

  function closeSpan() {
    if (spanOpen) {
      html += '</span>'
      spanOpen = false
    }
  }

  function parse256Color(params: number[], i: number): [string | null, number] {
    if (params[i + 1] === 5 && i + 2 < params.length) {
      const n = params[i + 2]
      if (n < 16) return [COLORS_16[n] ?? DEFAULT_FG, i + 3]
      if (n < 232) {
        // 216 color cube
        const idx = n - 16
        const r = Math.round((Math.floor(idx / 36) / 5) * 255)
        const g = Math.round(((Math.floor(idx / 6) % 6) / 5) * 255)
        const b = Math.round(((idx % 6) / 5) * 255)
        return [`#${hex(r)}${hex(g)}${hex(b)}`, i + 3]
      }
      // Grayscale
      const gray = 8 + (n - 232) * 10
      return [`#${hex(gray)}${hex(gray)}${hex(gray)}`, i + 3]
    }
    if (params[i + 1] === 2 && i + 4 < params.length) {
      const r = params[i + 2]
      const g = params[i + 3]
      const b = params[i + 4]
      return [`#${hex(r)}${hex(g)}${hex(b)}`, i + 5]
    }
    return [null, i + 1]
  }

  let i = 0
  while (i < ansi.length) {
    if (ansi[i] === '\x1b' && ansi[i + 1] === '[') {
      // Parse SGR sequence
      let j = i + 2
      while (j < ansi.length && ansi[j] !== 'm') j++
      const paramStr = ansi.slice(i + 2, j)
      const params = paramStr.split(';').map(s => parseInt(s, 10) || 0)

      closeSpan()

      let p = 0
      while (p < params.length) {
        const code = params[p]
        if (code === 0) {
          fg = null
          bg = null
          bold = false
          dim = false
          italic = false
          underline = false
          inverse = false
          p++
        } else if (code === 1) {
          bold = true
          p++
        } else if (code === 2) {
          dim = true
          p++
        } else if (code === 3) {
          italic = true
          p++
        } else if (code === 4) {
          underline = true
          p++
        } else if (code === 7) {
          inverse = true
          p++
        } else if (code === 22) {
          bold = false
          dim = false
          p++
        } else if (code === 23) {
          italic = false
          p++
        } else if (code === 24) {
          underline = false
          p++
        } else if (code === 27) {
          inverse = false
          p++
        } else if (code >= 30 && code <= 37) {
          fg = COLORS_16[code - 30] ?? DEFAULT_FG
          p++
        } else if (code === 38) {
          const [color, next] = parse256Color(params, p)
          fg = color
          p = next
        } else if (code === 39) {
          fg = null
          p++
        } else if (code >= 40 && code <= 47) {
          bg = COLORS_16[code - 40] ?? DEFAULT_BG
          p++
        } else if (code === 48) {
          const [color, next] = parse256Color(params, p)
          bg = color
          p = next
        } else if (code === 49) {
          bg = null
          p++
        } else if (code >= 90 && code <= 97) {
          fg = COLORS_16[code - 90 + 8] ?? DEFAULT_FG
          p++
        } else if (code >= 100 && code <= 107) {
          bg = COLORS_16[code - 100 + 8] ?? DEFAULT_BG
          p++
        } else {
          p++
        }
      }

      openSpan()
      i = j + 1
    } else if (ansi[i] === '\n') {
      html += '\n'
      i++
    } else {
      // Escape HTML special chars
      const ch = ansi[i]
      if (ch === '<') html += '&lt;'
      else if (ch === '>') html += '&gt;'
      else if (ch === '&') html += '&amp;'
      else html += ch
      i++
    }
  }

  closeSpan()
  return html
}

function hex(n: number): string {
  return Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')
}

function renderAnsiToHtmlFragment(ansi: string): string {
  const html = ansiToHtml(ansi).replace(/\n+$/, '')

  return `<pre style="background:${DEFAULT_BG};color:${DEFAULT_FG};font-family:'Fira Code',monospace;padding:8px;margin:0;line-height:1.2;overflow-x:auto;">${html}</pre>`
}

async function buildExamples() {
  mkdirSync(EXAMPLES_OUTPUT_DIR, {recursive: true})

  const files = readdirSync(EXAMPLES_DIR).filter(f => /\.example\.tsx$/.test(f))

  if (files.length === 0) {
    return
  }

  console.log(`Building ${files.length} example(s)...`)

  for (const file of files) {
    const name = file.replace(/\.example\.tsx$/, '')

    try {
      // Import the example module — default export is {width, height, title, App}
      const examplePath = join(EXAMPLES_DIR, file)
      const mod = await import(examplePath)
      const spec = mod.default

      if (!spec || !spec.App) {
        console.error(
          `  ✗ ${name}: expected default export {width, height, title, App}`,
        )
        continue
      }

      const {App, width, height, title} = spec

      // Render the React component
      const {createElement} = await import('react')
      const view = renderReact(createElement(App))
      const ansi = renderToAnsi(view, {width, height})
      const fragment = renderAnsiToHtmlFragment(ansi)

      // Write the rendered HTML
      const htmlPath = join(EXAMPLES_OUTPUT_DIR, `${name}.html.txt`)
      writeFileSync(htmlPath, fragment, 'utf-8')

      // Write the display source code:
      // - Strip the `export default {…}` spec line
      // - Add 'run' to the @teaui/react import
      // - Append run(<App />)
      let source = readFileSync(examplePath, 'utf-8')

      // Remove the export default spec object (last line(s))
      source = source.replace(/\n*export default \{[^}]*\}\s*$/m, '')

      // Add 'run' to the @teaui/react import and append run(<App />) call
      source = source.replace(
        /^(import \{)(.*?)(\} from '@teaui\/react')$/m,
        (match, pre, imports, post) => {
          if (imports.includes('run')) return match
          return `${pre}${imports.trimEnd()}, run${post}`
        },
      )
      const displaySource = source.trimEnd() + '\n\nrun(<App />)\n'

      const codePath = join(EXAMPLES_OUTPUT_DIR, `${name}.tsx`)
      writeFileSync(codePath, displaySource, 'utf-8')

      console.log(`  ✓ ${name} (${width}×${height})`)
    } catch (err) {
      console.error(`  ✗ ${name}: ${err}`)
    }
  }
}

async function main() {
  await buildExamples()
  console.log('Done.')
}

main()
