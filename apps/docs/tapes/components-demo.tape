# TeaUI Components Overview Demo
# Run with: vhs apps/docs/tapes/components-demo.tape

Output apps/docs/static/img/components-demo.gif

Set Shell "bash"
Set FontFamily "Fira Code"
Set FontSize 14
Set Width 80
Set Height 30
Set Theme "Builtin Dark"

Type "npx tsx apps/demos/components.ts --no-log"
Enter
Sleep 2s

# Interact with buttons
Tab
Sleep 300ms
Tab
Sleep 300ms
Tab
Sleep 300ms
Enter
Sleep 500ms

# Navigate through more components
Tab
Sleep 300ms
Tab
Sleep 300ms
Enter
Sleep 500ms

Screenshot
Sleep 1s

# Quit
Type "q"
Sleep 500ms
