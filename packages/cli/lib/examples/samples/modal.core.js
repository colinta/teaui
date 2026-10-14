import {Box, Container, Modal, Mouse, Screen, Style, Text} from '@teaui/core'

// The first child is the background; the second is presented only as an overlay.
class ModalHost extends Container {
  showModal = true

  dismiss() {
    this.showModal = false
    this.invalidateRender()
  }

  render(viewport) {
    if (viewport.contentSize.isEmpty) {
      return super.render(viewport)
    }
    const [background, modal] = this.children
    background.render(viewport)
    if (this.showModal) {
      viewport.requestModal(modal)
    }
  }
}

const background = new Text({
  width: 36,
  height: 10,
  text: [
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
  ].join('\n'),
})

const modal = new Modal({
  dim: true,
  dimStyle: new Style({foreground: 'gray', background: 'black'}),
  dismissOnClick: true,
  dismissOnEsc: false,
  onDismiss: () => host.dismiss(),
  // Claim clicks inside the dialog so they do not reach the modal's scrim.
  child: new Mouse({
    x: 4,
    y: 2,
    width: 28,
    height: 6,
    mouse: 'mouse.button.left',
    child: new Box({
      width: 'fill',
      height: 'fill',
      border: 'rounded',
      title: 'Publish document?',
      child: new Text({
        padding: 1,
        text: 'Review the changes.\nClick outside to close.',
      }),
    }),
  }),
})

const host = new ModalHost({
  width: 36,
  height: 10,
  children: [background, modal],
})
const [screen] = await Screen.start(host)
screen.render()
