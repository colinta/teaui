/** @jsxRuntime classic */
/** @jsx h */
import {h} from 'preact'
import type * as preact from 'preact'
import {registerElement} from '@teaui/preact'
import {SubprocessView} from './SubprocessView.js'
import type {SubprocessViewProps} from './SubprocessView.js'

type SubprocessProps = SubprocessViewProps

registerElement(
  'tui-subprocess',
  (props: SubprocessProps) => new SubprocessView(props),
)

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'tui-subprocess': SubprocessProps
    }
  }
}

export function Subprocess(props: SubprocessProps): preact.JSX.Element {
  return <tui-subprocess {...props} />
}
