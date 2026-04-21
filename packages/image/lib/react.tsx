import React from 'react'
import {registerElement} from '@teaui/react'
import {ImageView} from './ImageView.js'
import type {Props as ImageViewProps} from './ImageView.js'

type ImageProps = ImageViewProps

registerElement('tui-image', (props: ImageProps) => new ImageView(props))

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
