import {
  Screen,
  TrackMouse,
  ConsoleLog,
  Stack,
  Window,
  type View,
  interceptConsoleLog,
} from '@teaui/core'

interceptConsoleLog()

export async function demo(
  demoContent: View,
  showConsoleLog: boolean | number = false,
) {
  process.title = 'TeaUI'
  if (process.argv.includes('--no-log')) {
    showConsoleLog = false
  }

  const consoleLog = new ConsoleLog({
    height: typeof showConsoleLog === 'number' ? showConsoleLog : 10,
  })
  const [screen] = await Screen.start(
    async program => {
      // await iTerm2.setBackground(program, [23, 23, 23])

      return new Window({
        child: new TrackMouse({
          child: Stack.down({
            children: showConsoleLog
              ? [
                  ['flex1', demoContent],
                  ['natural', consoleLog],
                ]
              : [['flex1', demoContent]],
          }),
        }),
      })
    },
    {quitChar: 'C-c'},
  )

  screen.key('escape', function () {
    consoleLog.clear()
    screen.render()
  })
}
