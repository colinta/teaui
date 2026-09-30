import React from 'react'
import {registerElement} from '@teaui/react'
import {Subprocess as CoreSubprocess} from './Subprocess.js'
import type {SubprocessProps} from './Subprocess.js'

registerElement(
  'tui-subprocess',
  (props: SubprocessProps) => new CoreSubprocess(props),
)

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'tui-subprocess': SubprocessProps
    }
  }
}

export function Subprocess(props: SubprocessProps): JSX.Element {
  return <tui-subprocess {...props} />
}
