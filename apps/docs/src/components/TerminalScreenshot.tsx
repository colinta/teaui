import React, {useEffect, useState} from 'react'
import useBaseUrl from '@docusaurus/useBaseUrl'
import BrowserOnly from '@docusaurus/BrowserOnly'
import LiveTerminal from './LiveTerminal'
import {canRunLive} from '../live/registry'
import '../css/terminal.css'

interface Props {
  /** Screenshot name (without extension) */
  name: string
  /** Optional title shown in the terminal title bar */
  title?: string
  /** Directory to read from */
  dir?: 'examples'
  /**
   * Run the example live (in wterm) instead of showing the screenshot. The
   * screenshot is shown until the live terminal is ready.
   */
  live?: boolean
}

/**
 * Renders a pre-built screenshot HTML fragment in a styled terminal window frame.
 * Screenshots are generated at build time and stored in static/screenshots/ or static/examples/.
 */
export default function TerminalScreenshot({
  name,
  title,
  dir = 'examples',
  live = false,
}: Props) {
  const url = useBaseUrl(`/${dir}/${name}.html.txt`)
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    fetch(url)
      .then(r => r.text())
      .then(setHtml)
      .catch(() =>
        setHtml(
          '<pre style="color:#CC9393;padding:8px">Screenshot not found</pre>',
        ),
      )
  }, [url])

  const titleBar = title ? `│ ${title} │` : null
  const screenshot = (
    <div
      dangerouslySetInnerHTML={{
        __html:
          html ?? '<pre style="padding:8px;color:#808080">Loading...</pre>',
      }}
    />
  )

  return (
    <div className="terminal-frame">
      {titleBar && <div className="terminal-titlebar">{titleBar}</div>}
      <div className="terminal-body">
        {live && dir === 'examples' && canRunLive(name) ? (
          <BrowserOnly fallback={screenshot}>
            {() => <LiveTerminal name={name} placeholder={screenshot} />}
          </BrowserOnly>
        ) : (
          screenshot
        )}
      </div>
    </div>
  )
}
