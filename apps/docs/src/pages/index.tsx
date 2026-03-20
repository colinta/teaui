import React, {useEffect, useState} from 'react'
import Layout from '@theme/Layout'
import CodeBlock from '@theme/CodeBlock'
import Link from '@docusaurus/Link'
import useBaseUrl from '@docusaurus/useBaseUrl'
import TerminalScreenshot from '../components/TerminalScreenshot'
import '../css/index.css'

const WARM = '#f0dfaf' // zenburn yellow
const CYAN = '#8cd0d3' // zenburn cyan
const DIM = '#808080' // zenburn gray

type Span = {text: string; color: string}
// Each line is an array of {text, color} segments
const HERO_LINES: Span[][] = [
  [{text: '     ) ) )      ', color: DIM}],
  [{text: '    ( ( (       ', color: DIM}],
  [
    {text: '  ┌────────┐', color: WARM},
    {text: '──╮', color: DIM},
  ],
  [
    {text: '  │', color: WARM},
    {text: '╼╼╼╼╼╼╼╼', color: CYAN},
    {text: '│  │', color: WARM},
  ],
  [
    {text: '  │', color: WARM},
    {text: ' TeaUI  ', color: CYAN},
    {text: '│  │', color: WARM},
  ],
  [
    {text: '  │', color: WARM},
    {text: '╼╼╼╼╼╼╼╼', color: CYAN},
    {text: '│', color: WARM},
    {text: '──╯', color: DIM},
  ],
  [{text: '  ╰▄▄▄▄▄▄▄▄╯   ', color: WARM}],
  [{text: '               ', color: DIM}],
]

const FEATURES = [
  {
    icon: '█',
    title: 'Beautiful Components',
    desc: 'Buttons, inputs, accordions, tabs, trees, and more',
  },
  {
    icon: '◆',
    title: 'React',
    desc: 'Use JSX or the OOP core API — your choice',
  },
  {
    icon: '▓',
    title: 'Full Theming',
    desc: 'Style system with colors, borders, and text styles',
  },
  {
    icon: '░',
    title: 'Zero Deps*',
    desc: 'Minimal footprint, terminal-native rendering',
  },
]

export default function Home() {
  const codeUrl = useBaseUrl('/examples/hero.tsx')
  const [code, setCode] = useState<string | null>(null)

  useEffect(() => {
    fetch(codeUrl)
      .then(r => r.text())
      .then(setCode)
      .catch(() => setCode('// Source not found'))
  }, [codeUrl])

  return (
    <Layout
      title="TeaUI — Terminal UI Framework"
      description="React-compatible terminal UI framework for building beautiful fullscreen TUI applications"
    >
      <main className="landing">
        {/* Hero */}
        <section className="hero-section">
          <pre className="hero-ascii">
            {HERO_LINES.map((line, i) => (
              <div key={i}>
                {line.map((seg, j) => (
                  <span key={j} style={{color: seg.color}}>
                    {seg.text}
                  </span>
                ))}
              </div>
            ))}
          </pre>
          <p className="hero-tagline">React-compatible terminal UI framework</p>
          <div className="hero-actions">
            <Link className="hero-btn" to="/docs">
              [ Getting Started ]
            </Link>
            <Link
              className="hero-btn hero-btn--secondary"
              to="/docs/components/button"
            >
              [ Components ]
            </Link>
            <a
              className="hero-btn hero-btn--secondary"
              href="https://github.com/colinta/teaui"
            >
              [ GitHub ]
            </a>
          </div>
        </section>

        {/* Code + Screenshot side by side */}
        <section className="demo-section">
          <div className="demo-code">
            <div className="demo-label">│ index.tsx │</div>
            <CodeBlock language="tsx">{code ?? '// Loading...'}</CodeBlock>
          </div>
          <div className="demo-preview">
            <TerminalScreenshot name="hero" title="Output" dir="examples" />
          </div>
        </section>

        {/* Install */}
        <section className="install-section">
          <div className="install-box">
            <div className="install-label">│ Installation │</div>
            <pre>
              <code>npx @teaui/cli create 'app-name' -f react</code>
            </pre>
          </div>
        </section>

        {/* Features */}
        <section className="features-section">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </section>
      </main>
    </Layout>
  )
}
