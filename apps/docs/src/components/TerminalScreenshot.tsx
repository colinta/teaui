import React, {useEffect, useState} from 'react'
import useBaseUrl from '@docusaurus/useBaseUrl'
import '../css/terminal.css'

interface Props {
  /** Screenshot name (without .html extension) */
  name: string
  /** Optional title shown in the terminal title bar */
  title?: string
  /** Directory to read from (default: 'screenshots') */
  dir?: 'screenshots' | 'examples'
}

/**
 * Renders a pre-built screenshot HTML fragment in a styled terminal window frame.
 * Screenshots are generated at build time and stored in static/screenshots/ or static/examples/.
 */
export default function TerminalScreenshot({name, title, dir = 'screenshots'}: Props) {
  const url = useBaseUrl(`/${dir}/${name}.html`)
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    fetch(url)
      .then(r => r.text())
      .then(setHtml)
      .catch(() => setHtml('<pre style="color:#CC9393;padding:8px">Screenshot not found</pre>'))
  }, [url])

  const titleBar = title
    ? `┤ ${title} ├`
    : null

  return (
    <div className="terminal-frame">
      {titleBar && <div className="terminal-titlebar">{titleBar}</div>}
      <div
        className="terminal-body"
        dangerouslySetInnerHTML={{__html: html ?? '<pre style="padding:8px;color:#808080">Loading...</pre>'}}
      />
    </div>
  )
}
