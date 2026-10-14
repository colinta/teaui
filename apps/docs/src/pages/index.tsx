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
            <TerminalScreenshot name="hero" title="Output" />
          </div>
        </section>

        {/* CLI */}
        <section className="cli-section" aria-labelledby="cli-title">
          <div className="cli-heading">
            <h2 id="cli-title">TeaUI CLI</h2>
            <p>
              Scaffold a new application or inspect runnable component examples
              and their terminal output without leaving your shell.
            </p>
          </div>
          <div className="cli-steps">
            <article className="cli-step">
              <div className="cli-step-number">01</div>
              <h3>Install the CLI</h3>
              <p>Install the command globally with your package manager.</p>
              <CodeBlock language="bash">
                npm install --global @teaui/cli
              </CodeBlock>
            </article>
            <article className="cli-step">
              <div className="cli-step-number">02</div>
              <h3>Generate an app</h3>
              <p>Create a ready-to-run TeaUI project using React and JSX.</p>
              <CodeBlock language="bash">
                teaui create my-app --framework react
              </CodeBlock>
            </article>
            <article className="cli-step">
              <div className="cli-step-number">03</div>
              <h3>Show an example</h3>
              <p>
                Print a component's props, exact source, and rendered terminal
                output. Use <code>--core</code> for the OOP version.
              </p>
              <CodeBlock language="bash">
                teaui example button --react
              </CodeBlock>
            </article>
          </div>
          <p className="cli-hint">
            Run <code>teaui example</code> to list every available component.
          </p>
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
