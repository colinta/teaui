import {
  Screen,
  Box,
  Text,
  Stack,
  Button,
  Window,
  Style,
  Space,
} from '@teaui/core'

async function main() {
  const [screen, program] = await Screen.start(
    async () => {
      const log = new Text({text: '', style: new Style({italic: true})})
      return new Window({
        child: new Box({
          border: 'rounded',
          child: Stack.down([
            new Text({
              text: 'Hello from child!',
              style: new Style({bold: true}),
            }),
            new Button({
              title: 'Click me!',
              height: 3,
              theme: 'primary',
              onClick: () => {
                log.text += 'Button clicked!\n'
              },
            }),
            new Text({text: 'Press ctrl+q to quit'}),
            Space.vertical(1),
            new Text({
              text: 'LOG',
              style: new Style({bold: true, underline: true}),
            }),
            log,
          ]),
        }),
      })
    },
    {quitChar: 'C-q'},
  )
}

main()
