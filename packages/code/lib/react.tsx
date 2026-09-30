import React from 'react'
import {registerElement} from '@teaui/react'
import {Code as CoreCode} from './Code.js'
import type {Props as CodeProps} from './Code.js'

registerElement('tui-code', (props: CodeProps) => new CoreCode(props))

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
