import React from 'react'
import {registerElement} from '@teaui/react'
import {Image as CoreImage} from './Image.js'
import type {Props as ImageProps} from './Image.js'

registerElement('tui-image', (props: ImageProps) => new CoreImage(props))

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'tui-image': ImageProps
    }
  }
}

export function Image(props: ImageProps): JSX.Element {
  return <tui-image {...props} />
}
