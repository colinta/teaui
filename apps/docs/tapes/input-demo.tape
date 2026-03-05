# TeaUI Input Demo
# Run with: vhs apps/docs/tapes/input-demo.tape

Output apps/docs/static/img/input-demo.gif

Set Shell "bash"
Set FontFamily "Fira Code"
Set FontSize 14
Set Width 80
Set Height 24
Set Theme "Builtin Dark"

Type "npx tsx apps/demos/inputs.ts --no-log"
Enter
Sleep 2s

# Type into the first input field
Type "Hello, TeaUI!"
Sleep 500ms

# Move to next field with Tab
Tab
Sleep 300ms

Type "Multi-line support"
Sleep 500ms
Enter
Type "works great!"
Sleep 1s

Screenshot

# Quit
Type "q"
Sleep 500ms
