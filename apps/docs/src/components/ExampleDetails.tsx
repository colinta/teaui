import React from 'react'

interface Props {
  /** Summary text shown in the collapsed state */
  summary: string
  children: React.ReactNode
}

/**
 * A collapsible wrapper for secondary examples on component doc pages.
 * Uses native <details>/<summary> (Docusaurus-friendly).
 *
 * Usage in MDX:
 *   <ExampleDetails summary="With border style">
 *     <Example name="box-border" title="Box with border" />
 *   </ExampleDetails>
 */
export default function ExampleDetails({summary, children}: Props) {
  return (
    <details style={{marginTop: '1rem', marginBottom: '1rem'}}>
      <summary style={{cursor: 'pointer', fontWeight: 600}}>{summary}</summary>
      <div style={{marginTop: '0.5rem'}}>{children}</div>
    </details>
  )
}
