import React, {useState} from 'react'
import Layout from '@theme/Layout'
import BrowserOnly from '@docusaurus/BrowserOnly'
import LiveTerminal from '../components/LiveTerminal'
import {liveExampleNames} from '../live/registry'
import '../css/terminal.css'

const DEFAULT_EXAMPLE = 'tabs'

/**
 * Run any docs example live, full-size, in an in-browser terminal (wterm).
 */
export default function Playground() {
  const [name, setName] = useState(() =>
    liveExampleNames.includes(DEFAULT_EXAMPLE)
      ? DEFAULT_EXAMPLE
      : liveExampleNames[0],
  )

  return (
    <Layout
      title="Playground"
      description="Run TeaUI examples live in the browser"
    >
      <div className="playground">
        <ul className="playground__list" aria-label="Examples">
          {liveExampleNames.map(example => (
            <li key={example}>
              <button
                type="button"
                aria-current={example === name}
                onClick={() => setName(example)}
              >
                {example}
              </button>
            </li>
          ))}
        </ul>
        <div className="playground__main">
          <div className="terminal-frame">
            <div className="terminal-titlebar">{`│ ${name} │`}</div>
            <div className="terminal-body">
              <BrowserOnly>
                {() => <LiveTerminal key={name} name={name} fill autoFocus />}
              </BrowserOnly>
            </div>
          </div>
          <div className="playground__hint">
            TeaUI running in the browser via{' '}
            <a href="https://github.com/vercel-labs/wterm">wterm</a>. Click the
            terminal to focus it; press Esc then Tab to move focus back to the
            page.
          </div>
        </div>
      </div>
    </Layout>
  )
}
