import {
  Screen,
  Box,
  Text,
  Stack,
  Button,
  Window,
  Space,
  Style,
} from '@teaui/core'

async function main() {
  let counter = 0
  let counterText: Text

  const [screen, program] = await Screen.start(async () => {
    counterText = new Text({text: `Counter: ${counter}`})

    return new Window({
      child: new Box({
        border: 'double',
        child: Stack.down([
          new Text({text: 'Subprocess Child App', style: new Style({bold: true})}),
          new Text({text: ''}),
          counterText,
          new Text({text: ''}),
          new Button({
            title: 'Increment',
            height: 3,
            theme: 'primary',
            onClick: () => {
              counter++
              counterText.update({text: `Counter: ${counter}`})
              screen.render()
            },
          }),
          ['flex1', new Space()],
          new Text({text: 'Press q to quit', style: new Style({dim: true})}),
        ]),
      }),
    })
  }, {quitChar: 'C-q'})
}

main()
