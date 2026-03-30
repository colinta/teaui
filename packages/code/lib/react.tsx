import React from 'react'
import {registerElement} from '@teaui/react'
import {CodeView} from './CodeView.js'
import type {Props as CodeViewProps} from './CodeView.js'

type CodeProps = CodeViewProps

registerElement('tui-code', (props: CodeProps) => new CodeView(props))

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'tui-code': CodeProps
    }
  }
}

export function Code(props: CodeProps): JSX.Element {
  return <tui-code {...props} />
}
