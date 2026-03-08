import React from 'react'
import {registerElement} from '@teaui/react'
import {SubprocessView} from './SubprocessView.js'
import type {SubprocessViewProps} from './SubprocessView.js'

type SubprocessProps = SubprocessViewProps

registerElement('tui-subprocess', (props: SubprocessProps) => new SubprocessView(props))

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
