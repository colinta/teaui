import React, {createRef} from 'react'
import {
  Container,
  Style,
  type ContainerProps,
  type Modal as CoreModal,
  type Viewport,
} from '@teaui/core'
import {Box, Modal, Mouse, Text, registerElement, run} from '@teaui/react'

// Modal is not an automatic React portal. A Core host presents it during render.
class ModalHost extends Container {
  showModal = true

  dismiss() {
    this.showModal = false
    this.invalidateRender()
  }

  render(viewport: Viewport) {
    if (viewport.contentSize.isEmpty) {
      return super.render(viewport)
    }
    const [background, modal] = this.children
    background.render(viewport)
    if (this.showModal) {
      viewport.requestModal(modal as CoreModal)
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'modal-example-host': Omit<ContainerProps, 'child' | 'children'> & {
        children?: React.ReactNode
        ref?: React.Ref<ModalHost>
      }
    }
  }
}

registerElement('modal-example-host', props => new ModalHost(props))
const host = createRef<ModalHost>()

const [screen] = await run(
  <modal-example-host width={36} height={10} ref={host}>
    <Text width={36} height={10}>
      {[
        'Document editor',
        'Draft: quarterly report',
        '',
        '        Hidden draft text',
        '',
        '',
        '',
        '',
        'Underlying content stays put',
        'Click outside to dismiss',
      ].join('\n')}
    </Text>
    <Modal
      dim
      dimStyle={new Style({foreground: 'gray', background: 'black'})}
      dismissOnClick
      dismissOnEsc={false}
      onDismiss={() => host.current?.dismiss()}
    >
      {/* Claim clicks inside the dialog so they do not reach the modal's scrim. */}
      <Mouse x={4} y={2} width={28} height={6} mouse="mouse.button.left">
        <Box
          width="fill"
          height="fill"
          border="rounded"
          title="Publish document?"
        >
          <Text padding={1}>
            {'Review the changes.\nClick outside to close.'}
          </Text>
        </Box>
      </Mouse>
    </Modal>
  </modal-example-host>,
)
screen.render()
