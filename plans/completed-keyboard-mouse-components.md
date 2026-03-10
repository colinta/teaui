{
"name": "Create Keyboard and Mouse fallback event components",
"steps": [
{"description": "Study event flow: FocusManager for keys, MouseManager for mouse", "done": true},
{"description": "Add registerKeyboard fallback mechanism to FocusManager", "done": true},
{"description": "Plumb registerKeyboard through Viewport, Screen, testing.ts, renderToAnsi.ts", "done": true},
{"description": "Create Keyboard component (packages/core/lib/components/Keyboard.ts)", "done": true},
{"description": "Create Mouse component (packages/core/lib/components/Mouse.ts)", "done": true},
{"description": "Export from packages/core/lib/components/index.ts", "done": true},
{"description": "Add to React reconciler (createInstance + JSX types + wrapper)", "done": true},
{"description": "Add to Preact reconciler (createInstance + JSX types + wrapper)", "done": true},
{"description": "Build all packages and verify tests pass", "done": true}
],
"summary": "Created two new core components: Keyboard (fallback key listener) and Mouse (fallback mouse listener). Keyboard registers via a new FocusManager.registerKeyboard() mechanism — key events that aren't consumed by hotkeys or a focused view fall through to the innermost Keyboard listener. Mouse uses existing registerMouse() on its visible area; children naturally override since they render after parents. Both added to React and Preact reconcilers."
}
