{
"name": "Create Alert and Callout components (with shared Notification base class)",
"steps": [
{
"description": "Create Notification base class in packages/core/lib/components/Notification.ts",
"details": [
"Extends Container, owns a managed #stack (Stack) for layout",
"Props: title (optional string), purpose (Purpose), direction (Direction, default 'down')",
"Private properties: #stack, #titleStyle (Style({bold: true})), #titleView (Text | undefined), #separator (Separator | undefined)",
"If title is provided, adds bold Text (#titleView) + Separator (#separator) before children",
"Override add() to forward to #stack",
"Not exported from index.ts — internal base class only"
],
"done": true
},
{
"description": "Create Alert component in packages/core/lib/components/Alert.ts",
"details": [
"Extends Notification",
"Private properties: #box (Box with border='rounded', padding=1)",
"Notification's #stack is placed inside #box",
"Static helper: Alert.modal(props) returns {alert, modal} with dim=true, dismissOnEsc=true defaults",
"Core API: user creates Alert via Alert.modal(), calls viewport.requestModal(modal)"
],
"done": true
},
{
"description": "Create Callout component in packages/core/lib/components/Callout.ts",
"details": [
"Extends Notification",
"Private properties: #backgroundStyle (bright fg + dim bg), #barStyle (highlight fg + dim bg)",
"Renders '▏' character at x=0 for each row using #barStyle",
"Paints #backgroundStyle across full area",
"Children rendered clipped at x=2 (bar + 1 space)",
"naturalSize adds 2 columns for the bar + space"
],
"done": true
},
{
"description": "Export Alert and Callout from packages/core/lib/components/index.ts (Notification is NOT exported)",
"done": true
},
{
"description": "Add to React reconciler createInstance switch in packages/react/lib/reconciler.ts",
"details": [
"Register 'alert'/'tui-alert' → new Alert(props)",
"Register 'callout'/'tui-callout' → new Callout(props)"
],
"done": true
},
{
"description": "Add JSX type declarations and wrapper components in packages/react/lib/components.tsx",
"details": [
"Alert React wrapper: composes <Modal dim dismissOnEsc dismissOnClick> around <tui-alert>",
"visible prop controls rendering (if !visible, return null)",
"onDismiss forwarded to Modal",
"Callout React wrapper: simple pass-through to <tui-callout>"
],
"done": true
},
{
"description": "Add tests in packages/core/tests/components/ for Alert and Callout",
"details": [
"Snapshot tests covering: with/without title, various purposes, direction prop",
"Alert: test rounded box rendering, naturalSize",
"Callout: test bar character, background style, title+separator rendering"
],
"done": true
},
{
"description": "Add example demos in apps/docs/examples/",
"details": [
"alert.example.tsx: Button that presents Alert modal",
"callout.example.tsx: Various Callout styles (with/without title, different purposes)"
],
"done": true
}
],
"summary": "Add Alert and Callout components sharing an internal Notification base class. Notification manages a #stack for layout, #titleStyle/#titleView/#separator for optional bold titles. Alert owns a #box (rounded border) and is designed for modal presentation via Alert.modal() helper. Callout uses #backgroundStyle (bright fg/dim bg) and #barStyle (highlight fg) to render a left '▏' accent bar with 1 space padding. React <Alert> composes <Modal> + <tui-alert> with a visible prop. Notification is not exported."
}
