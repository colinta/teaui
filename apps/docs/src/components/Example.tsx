import React, {useEffect, useState} from 'react'
import useBaseUrl from '@docusaurus/useBaseUrl'
import CodeBlock from '@theme/CodeBlock'
import '../css/terminal.css'

interface Props {
  /** Example name (matches the .example.tsx filename) */
  name: string
  /** Optional title shown in the terminal title bar */
  title?: string
}

/**
 * Renders a React example with both its source code and rendered terminal output.
 * Source and screenshots are generated at build time from examples/*.example.tsx files.
 */
export default function Example({name, title}: Props) {
  const htmlUrl = useBaseUrl(`/examples/${name}.html.txt`)
  const codeUrl = useBaseUrl(`/examples/${name}.tsx`)
  const [html, setHtml] = useState<string | null>(null)
  const [code, setCode] = useState<string | null>(null)

  useEffect(() => {
    fetch(htmlUrl)
      .then(r => r.text())
      .then(setHtml)
      .catch(() =>
        setHtml(
          '<pre style="color:#CC9393;padding:8px">Screenshot not found</pre>',
        ),
      )
  }, [htmlUrl])

  useEffect(() => {
    fetch(codeUrl)
      .then(r => r.text())
      .then(setCode)
      .catch(() => setCode('// Source not found'))
  }, [codeUrl])

  const titleBar = title ? `│ ${title} │` : null

  return (
    <div className="example-container">
      <div className="example-output">
        <div className="terminal-frame">
          {titleBar && <div className="terminal-titlebar">{titleBar}</div>}
          <div
            className="terminal-body"
            dangerouslySetInnerHTML={{
              __html:
                html ??
                '<pre style="padding:8px;color:#808080">Loading...</pre>',
            }}
          />
        </div>
      </div>
      <div className="example-code">
        <CodeBlock language="tsx" title={`${name}.tsx`}>
          {code ?? '// Loading...'}
        </CodeBlock>
      </div>
    </div>
  )
}
