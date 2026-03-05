import React from 'react'
import Layout from '@theme/Layout'
import Link from '@docusaurus/Link'
import TerminalScreenshot from '../components/TerminalScreenshot'
import '../css/index.css'

const HERO_ASCII = `
╔════════════════════════════════════════╗
║                                        ║
║   ████████╗███████╗ █████╗ ██╗   ██╗██╗║
║   ╚══██╔══╝██╔════╝██╔══██╗██║   ██║██║║
║      ██║   █████╗  ███████║██║   ██║██║║
║      ██║   ██╔══╝  ██╔══██║██║   ██║██║║
║      ██║   ███████╗██║  ██║╚██████╔╝██║║
║      ╚═╝   ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝║
║                                        ║
╚════════════════════════════════════════╝`.trim()

const REACT_EXAMPLE = `import React, {useReducer} from 'react'
import {interceptConsoleLog} from '@teaui/core'
import {Box, Button, Stack, run} from '@teaui/react'

interceptConsoleLog()

function App() {
  const [bang, goto10] = useReducer(s => s + '!', '')
  return (
    <Box border="single">
      <Stack.down>
        First there was Ncurses{bang}
        <Button onClick={goto10}>Tell me more!</Button>
      </Stack.down>
    </Box>
  )
}

run(<App />)`

const FEATURES = [
  {icon: '█', title: '26 Components', desc: 'Buttons, inputs, accordions, tabs, trees, and more'},
  {icon: '◆', title: 'React & Preact', desc: 'Use JSX or the OOP core API — your choice'},
  {icon: '▓', title: 'Full Theming', desc: 'Style system with colors, borders, and text styles'},
  {icon: '░', title: 'Zero Deps*', desc: 'Minimal footprint, terminal-native rendering'},
]

export default function Home() {
  return (
    <Layout title="TeaUI — Terminal UI Framework" description="React-powered terminal UI framework for building beautiful fullscreen TUI applications">
      <main className="landing">
        {/* Hero */}
        <section className="hero-section">
          <pre className="hero-ascii">{HERO_ASCII}</pre>
          <p className="hero-tagline">React-powered terminal UI framework</p>
          <div className="hero-actions">
            <Link className="hero-btn" to="/docs">[ Getting Started ]</Link>
            <Link className="hero-btn hero-btn--secondary" to="/docs/components/button">[ Components ]</Link>
            <a className="hero-btn hero-btn--secondary" href="https://github.com/colinta/teaui">[ GitHub ]</a>
          </div>
        </section>

        {/* Code + Screenshot side by side */}
        <section className="demo-section">
          <div className="demo-code">
            <div className="demo-label">┤ index.tsx ├</div>
            <pre><code>{REACT_EXAMPLE}</code></pre>
          </div>
          <div className="demo-preview">
            <TerminalScreenshot name="stack" title="Output" />
          </div>
        </section>

        {/* Install */}
        <section className="install-section">
          <div className="install-box">
            <div className="install-label">┤ Installation ├</div>
            <pre><code>pnpm install @teaui/core @teaui/react react @types/react</code></pre>
          </div>
        </section>

        {/* Features */}
        <section className="features-section">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-border-top">┌{'─'.repeat(28)}┐</div>
              <div className="feature-content">
                <span className="feature-icon">{f.icon}</span>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
              <div className="feature-border-bot">└{'─'.repeat(28)}┘</div>
            </div>
          ))}
        </section>
      </main>
    </Layout>
  )
}
