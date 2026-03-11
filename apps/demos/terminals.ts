import path from 'path'
import {fileURLToPath} from 'url'
import {
  Screen,
  Box,
  Text,
  Stack,
  Window,
  Style,
  Button,
  Input,
  interceptConsoleLog,
  ConsoleLog,
  View,
  Viewport,
  Size,
} from '@teaui/core'
import {SubprocessView} from '@teaui/subprocess'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface TerminalSession {
  id: string
  title: string
  subprocess: SubprocessView
  isActive: boolean
}

class TerminalManager extends View {
  private sessions: TerminalSession[] = []
  private activeSessionId: string | null = null
  private sessionCounter = 0
  private sidebar: Box
  private mainContent: Box
  private consoleLog: ConsoleLog
  private rootStack: Stack

  constructor() {
    super()

    this.consoleLog = new ConsoleLog({height: 5})

    // Create sidebar with add button
    this.sidebar = new Box({})
    this.updateSidebar()

    // Create main content area
    this.mainContent = new Box({})
    this.updateMainContent()

    // Layout: sidebar on left, main content on right
    this.rootStack = Stack.right([
      [
        'natural',
        new Box({
          border: 'single',
          width: 25,
          child: this.sidebar,
        }),
      ],
      [
        'flex1',
        Stack.down([
          ['flex1', this.mainContent],
          ['natural', this.consoleLog],
        ]),
      ],
    ])
  }

  render(viewport: Viewport) {
    this.rootStack.render(viewport)
  }

  naturalSize(available: Size) {
    return this.rootStack.naturalSize(available)
  }

  private updateSidebar() {
    this.sidebar.update({
      child: Stack.down([
        new Text({
          text: ' Terminal Sessions',
          style: new Style({bold: true}),
        }),
        new Text({text: ''}), // spacing
        new Button({
          title: '+ Add Session',
          height: 3,
          theme: 'primary',
          onClick: () => this.addSession(),
        }),
        new Text({text: ''}), // spacing
        ...this.createSessionList(),
      ]),
    })
  }

  private createSessionList(): View[] {
    const views: View[] = []

    for (const session of this.sessions) {
      const isActive = session.id === this.activeSessionId

      // Create editable title input
      const titleInput = new Input({
        value: session.title,
        height: 1,
        onSubmit: (value: string) => {
          session.title = value || 'Untitled'
          this.updateSidebar()
        },
      })

      // Use text display instead of input for now to avoid click handling complexity
      const sessionItem = new Text({
        text: `${isActive ? '▶ ' : '  '}${session.title}`,
        style: new Style({
          bold: isActive,
        }),
      })

      views.push(sessionItem)
    }

    return views
  }

  private addSession() {
    this.sessionCounter++
    const sessionId = `session-${this.sessionCounter}`

    const subprocess = new SubprocessView({
      command: 'npx',
      args: ['tsx', path.resolve(__dirname, 'simple.ts')],
      onData: data => {
        // Log raw output length for debugging
      },
      onExit: code => {
        console.log(`Session ${sessionId} exited with code ${code}`)
        this.removeSession(sessionId)
        this.screen?.render()
      },
    })

    const session: TerminalSession = {
      id: sessionId,
      title: 'Untitled',
      subprocess,
      isActive: false,
    }

    this.sessions.push(session)
    this.switchToSession(sessionId)
  }

  private switchToSession(sessionId: string) {
    // Update active flags
    for (const session of this.sessions) {
      session.isActive = session.id === sessionId
    }

    this.activeSessionId = sessionId
    this.updateSidebar()
    this.updateMainContent()
    this.screen?.render()
  }

  private removeSession(sessionId: string) {
    const index = this.sessions.findIndex(s => s.id === sessionId)
    if (index === -1) return

    this.sessions.splice(index, 1)

    // If this was the active session, switch to another one or clear
    if (this.activeSessionId === sessionId) {
      if (this.sessions.length > 0) {
        this.switchToSession(this.sessions[0].id)
      } else {
        this.activeSessionId = null
        this.updateMainContent()
      }
    }

    this.updateSidebar()
  }

  private updateMainContent() {
    const activeSession = this.sessions.find(s => s.id === this.activeSessionId)

    if (activeSession) {
      this.mainContent.update({
        child: Stack.down([
          new Box({
            border: 'single',
            height: 3,
            child: new Text({
              text: ` ${activeSession.title}`,
              style: new Style({bold: true}),
            }),
          }),
          ['flex1', activeSession.subprocess],
        ]),
      })
    } else {
      this.mainContent.update({
        child: new Box({
          border: 'single',
          child: Stack.down([
            new Text({text: ''}),
            new Text({
              text: 'No active terminal sessions',
              style: new Style({italic: true, dim: true}),
            }),
            new Text({text: 'Click "Add Session" to create one'}),
            new Text({text: ''}),
          ]),
        }),
      })
    }
  }
}

async function main() {
  interceptConsoleLog()

  const [screen, program] = await Screen.start(
    async () =>
      new Window({
        child: new TerminalManager(),
      }),
    {quitChar: undefined},
  )

  program.key('C-q', () => {
    screen.exit()
  })
}

main()
