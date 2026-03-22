# Alert & Callout Component Design

## Shared Base: `Notification`

```
packages/core/lib/components/Notification.ts
```

Not exported — internal base class only.

### Props

```ts
interface Props extends ContainerProps {
  title?: string // Optional title text (rendered bold)
  purpose?: Purpose // Theme purpose: 'primary' | 'cancel' | 'proceed' | etc.
  direction?: Direction // Stack direction for children, default 'down'
}
```

### Internal Structure

- Owns a `Stack` (direction from props, default `'down'`)
- If `title` is provided:
  - Adds a `Text` (bold, wrapping) at the top of the Stack
  - Adds a `Separator.horizontal()` below the title
- `add(child, at?)` forwards to the internal Stack
- `removeChild(child)` forwards to the internal Stack
- Sets `this.theme = Theme[purpose]` when purpose is provided

### Class Skeleton

```ts
export class Notification extends Container {
  #stack: Stack
  #titleView: Text | undefined
  #titleStyle: Style // bold style for the title text
  #separator: Separator | undefined

  constructor(props: Props) {
    super(props)
    this.#titleStyle = new Style({bold: true})

    this.#stack = new Stack({direction: props.direction ?? 'down'})
    super.add(this.#stack) // add Stack to Container directly

    if (props.title) {
      this.#titleView = new Text({
        text: props.title,
        style: this.#titleStyle,
        wrap: true,
      })
      this.#stack.add(this.#titleView)
      this.#separator = Separator.horizontal()
      this.#stack.add(this.#separator)
    }

    if (props.purpose) {
      this.theme = Theme[props.purpose]
    }
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update(props: Props) {
    this.#stack.direction = props.direction ?? 'down'

    if (props.title && this.#titleView) {
      this.#titleView.text = props.title
    } else if (props.title && !this.#titleView) {
      this.#titleView = new Text({
        text: props.title,
        style: this.#titleStyle,
        wrap: true,
      })
      this.#separator = Separator.horizontal()
      this.#stack.add(this.#titleView, 0)
      this.#stack.add(this.#separator!, 1)
    } else if (!props.title && this.#titleView) {
      this.#stack.removeChild(this.#titleView)
      this.#stack.removeChild(this.#separator!)
      this.#titleView = undefined
      this.#separator = undefined
    }

    if (props.purpose) {
      this.theme = Theme[props.purpose]
    }
  }

  // Forward add/remove to the managed Stack
  add(child: View, at?: number) {
    this.#stack.add(child, at)
  }

  removeChild(child: View) {
    this.#stack.removeChild(child)
  }
}
```

---

## Alert

```
packages/core/lib/components/Alert.ts
```

### Design

An Alert is a notification meant to be presented in a modal overlay. It draws
inside a rounded-corner `Box`. The core API creates an Alert and presents it
via `viewport.requestModal()`. The React wrapper _always_ presents in a modal.

### Props

```ts
interface Props extends NotificationProps {
  // Inherits: title, purpose, direction
  // Alert does not add new props — Modal props (dim, dismissOnEsc, etc.)
  // belong to the Modal wrapper.
}
```

### Internal Structure

- Extends `Notification`
- Owns a `Box` with `border='rounded'` and `padding={1}`
- The Notification's Stack is added inside the Box
- The Box is added to the Container directly via `super.add()`

### Private Style Properties

```ts
class Alert extends Notification {
  #box: Box // rounded-corner box wrapping the content
}
```

The Alert itself doesn't need drawing styles — the Box handles border rendering
using the theme, and the title style is owned by the Notification base class
(`#titleStyle`).

### Convenience: `Alert.modal()`

For the core API, a static helper creates both the Alert and its Modal:

```ts
static modal(props: Props & ModalProps): {alert: Alert, modal: Modal} {
  const alert = new Alert(props)
  const modal = new Modal({
    dim: props.dim ?? true,
    dismissOnEsc: props.dismissOnEsc ?? true,
    dismissOnClick: props.dismissOnClick ?? true,
    onDismiss: props.onDismiss,
    children: [alert],
  })
  return {alert, modal}
}
```

### Core Usage

```ts
const {modal} = Alert.modal({
  title: 'Confirm Delete',
  purpose: 'cancel',
  onDismiss: () => {
    /* close */
  },
  children: [
    new Text({text: 'Are you sure you want to delete this item?'}),
    Stack.right({gap: 1}, [
      new Button({
        title: 'Delete',
        onClick: () => {
          /* delete */
        },
      }),
      new Button({
        title: 'Cancel',
        onClick: () => {
          /* cancel */
        },
      }),
    ]),
  ],
})
viewport.requestModal(modal)
```

### Mockup — Alert (in modal with dim)

```
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈  ← dimmed background
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
┈┈┈┈┈┈┈┈╭──────────────────────────╮┈┈┈┈┈┈┈┈
┈┈┈┈┈┈┈┈│ Confirm Delete           │┈┈┈┈┈┈┈┈
┈┈┈┈┈┈┈┈│ ──────────────────────── │┈┈┈┈┈┈┈┈
┈┈┈┈┈┈┈┈│ Are you sure you want to │┈┈┈┈┈┈┈┈
┈┈┈┈┈┈┈┈│ delete this item?        │┈┈┈┈┈┈┈┈
┈┈┈┈┈┈┈┈│                          │┈┈┈┈┈┈┈┈
┈┈┈┈┈┈┈┈│  [ Delete ] [ Cancel ]   │┈┈┈┈┈┈┈┈
┈┈┈┈┈┈┈┈╰──────────────────────────╯┈┈┈┈┈┈┈┈
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
```

### Mockup — Alert (no title, info purpose)

```
┈┈┈┈┈┈┈┈╭──────────────────────────╮┈┈┈┈┈┈┈┈
┈┈┈┈┈┈┈┈│                          │┈┈┈┈┈┈┈┈
┈┈┈┈┈┈┈┈│ File saved successfully. │┈┈┈┈┈┈┈┈
┈┈┈┈┈┈┈┈│                          │┈┈┈┈┈┈┈┈
┈┈┈┈┈┈┈┈│       [ OK ]             │┈┈┈┈┈┈┈┈
┈┈┈┈┈┈┈┈│                          │┈┈┈┈┈┈┈┈
┈┈┈┈┈┈┈┈╰──────────────────────────╯┈┈┈┈┈┈┈┈
```

---

## React `<Alert>` Wrapper

The React wrapper **always** presents in a modal via `<Modal>` composition.
It accepts a `visible` prop to control presentation.

### Implementation

```tsx
export function Alert({
  visible,
  onDismiss,
  dim = true,
  dismissOnEsc = true,
  dismissOnClick = true,
  children,
  ...props
}: AlertReactProps) {
  if (!visible) return null

  return (
    <Modal
      dim={dim}
      dismissOnEsc={dismissOnEsc}
      dismissOnClick={dismissOnClick}
      onDismiss={onDismiss}
    >
      <tui-alert {...props}>{children}</tui-alert>
    </Modal>
  )
}
```

### React Props

```ts
interface AlertReactProps {
  visible?: boolean // Show/hide the modal alert (default: false)
  title?: string
  purpose?: Purpose
  direction?: Direction
  onDismiss?: () => void
  // Modal props forwarded:
  dim?: boolean // default: true
  dismissOnEsc?: boolean // default: true
  dismissOnClick?: boolean // default: true
  children?: React.ReactNode
}
```

### React Usage

```tsx
function MyApp() {
  const [showAlert, setShowAlert] = useState(false)

  return (
    <Stack.down>
      <Button title="Delete" onClick={() => setShowAlert(true)} />
      <Alert
        visible={showAlert}
        title="Confirm Delete"
        purpose="cancel"
        onDismiss={() => setShowAlert(false)}
      >
        <Text>Are you sure?</Text>
        <Stack.right gap={1}>
          <Button
            title="Delete"
            onClick={() => {
              /* delete */
            }}
          />
          <Button title="Cancel" onClick={() => setShowAlert(false)} />
        </Stack.right>
      </Alert>
    </Stack.down>
  )
}
```

---

## Callout

```
packages/core/lib/components/Callout.ts
```

### Design

A Callout is an inline notification with a left accent bar (`▏`). It uses bright
foreground text on a dim background. When a title is provided, it renders bold
with a separator.

### Props

```ts
interface Props extends NotificationProps {
  // Inherits: title, purpose, direction
  // No additional props
}
```

### Internal Structure

- Extends `Notification`
- `naturalSize`: adds 2 columns for the `▏` bar + space on the left
- `render`:
  1. Paints dim background across the full area
  2. Draws `▏` in highlight color at x=0 for each visible row
  3. Renders children (via super / the Stack) clipped to x=2..width

### Private Style Properties

```ts
class Callout extends Notification {
  #backgroundStyle: Style // bright foreground + dim background (text area)
  #barStyle: Style // highlight foreground + dim background (▏ character)
}
```

These are computed from the theme in the constructor and updated when
purpose/theme changes:

```ts
#updateStyles() {
  this.#backgroundStyle = new Style({
    foreground: this.theme.brightTextColor,
    background: this.theme.dimBackgroundColor,
  })
  this.#barStyle = new Style({
    foreground: this.theme.highlightColor,
    background: this.theme.dimBackgroundColor,
  })
}
```

### Mockup — Callout with title (purpose: primary/blue)

```
▏ Note
▏ ────────────────────────
▏ Remember to save your
▏ work before closing.
```

(bright foreground text, dim background fill, `▏` accent in theme highlight)

### Mockup — Callout without title (purpose: cancel/red)

```
▏ This action cannot be
▏ undone. All data will be
▏ permanently deleted.
```

### Mockup — Callout with title and children (purpose: proceed/green)

```
▏ Success
▏ ────────────────────────
▏ Your changes have been
▏ saved.
▏
▏ Next steps:
▏  • Review the dashboard
▏  • Share with your team
```

### Rendering Detail

```ts
render(viewport: Viewport) {
  if (viewport.isEmpty) {
    return
  }

  // 1. Paint dim background with bright foreground
  viewport.paint(this.#backgroundStyle)

  // 2. Draw left accent bar
  for (let y = 0; y < viewport.contentSize.height; y++) {
    viewport.write('▏', new Point(0, y), this.#barStyle)
  }

  // 3. Render children offset by 2 columns (bar + space)
  viewport.clipped(
    new Rect(new Point(2, 0), viewport.contentSize.shrink(2, 0)),
    inside => super.render(inside),
  )
}

naturalSize(available: Size): Size {
  // Add 2 columns for the bar + space
  const innerAvailable = available.shrink(2, 0)
  const innerSize = super.naturalSize(innerAvailable)
  return innerSize.grow(2, 0)
}
```

### React Usage

```tsx
<Callout title="Note" purpose="primary">
  <Text>Remember to save your work before closing.</Text>
</Callout>

<Callout purpose="cancel">
  <Text>This action cannot be undone.</Text>
</Callout>
```

---

## File Summary

| File                                             | Description                                                                                   |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `packages/core/lib/components/Notification.ts`   | Base class: managed Stack, `#titleStyle`, `#titleView`, `#separator`, title/purpose/direction |
| `packages/core/lib/components/Alert.ts`          | `#box` (rounded), modal presentation, `Alert.modal()` helper                                  |
| `packages/core/lib/components/Callout.ts`        | `#backgroundStyle`, `#barStyle`, left `▏` bar rendering                                       |
| `packages/core/lib/components/index.ts`          | Export Alert, Callout (Notification is **not** exported)                                      |
| `packages/react/lib/reconciler.ts`               | Register `tui-alert`, `tui-callout`                                                           |
| `packages/react/lib/components.tsx`              | `<Alert>` (composes `<Modal>` + `<tui-alert>`, `visible` prop), `<Callout>` (pass-through)    |
| `packages/core/tests/components/Alert.test.ts`   | Snapshot tests for Alert rendering                                                            |
| `packages/core/tests/components/Callout.test.ts` | Snapshot tests for Callout rendering                                                          |
| `apps/docs/examples/alert.example.tsx`           | Demo: Button → shows Alert modal                                                              |
| `apps/docs/examples/callout.example.tsx`         | Demo: Various Callout styles                                                                  |

## Style Properties Summary

| Class          | Private Property   | Purpose                                                      |
| -------------- | ------------------ | ------------------------------------------------------------ |
| `Notification` | `#titleStyle`      | `Style({bold: true})` — applied to title Text                |
| `Notification` | `#titleView`       | `Text` instance (or undefined if no title)                   |
| `Notification` | `#separator`       | `Separator` instance (or undefined if no title)              |
| `Notification` | `#stack`           | Managed `Stack` for child layout                             |
| `Alert`        | `#box`             | `Box({border: 'rounded', padding: 1})` wrapping content      |
| `Callout`      | `#backgroundStyle` | `Style({foreground: brightText, background: dimBackground})` |
| `Callout`      | `#barStyle`        | `Style({foreground: highlight, background: dimBackground})`  |
