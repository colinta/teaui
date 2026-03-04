import {type Props as ContainerProps, Container} from '../Container.js'
import {Size} from '../geometry.js'

export class Window extends Container {
  constructor({children, ...viewProps}: ContainerProps = {}) {
    super(viewProps)
  }

  naturalSize(available: Size): Size {
    // even though we use the parent size no matter what, we do need to give child
    // views a chance to "resize" according to the available frame
    super.naturalSize(available)
    return available
  }
}
