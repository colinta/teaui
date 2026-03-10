{
"name": "Fix Ctrl+Alt+key input parsing",
"steps": [
{"description": "Diagnose why Ctrl+Alt+key triggers escape and splits into two events", "done": true},
{"description": "Add ESC + control-character branch to input parser in packages/term/src/input.ts", "done": true},
{"description": "Handle ESC + 0x0D (Alt+Return) and ESC + 0x09 (Alt+Tab) as special cases", "done": true},
{"description": "Add tests for ctrl+alt+a, ctrl+alt+d, ctrl+alt+z, alt+return, alt+tab", "done": true},
{"description": "Verify all existing input tests still pass", "done": true}
],
"summary": "Fixed Ctrl+Alt+key input parsing in packages/term/src/input.ts. Terminals send ESC followed by a control character for these combos, but the parser only checked for ESC + printable (charCode >= 0x20). Added a new branch before the Alt+char check that detects ESC + control char and emits a single event with both ctrl and alt flags. This fixed three bugs: spurious escape events clearing the log, Ctrl+Alt+Q quitting via the quitChar handler, and Ctrl+Alt hotkeys never matching."
}
