export function expandCommandAbbreviation(
  argv: string[],
  commandNames: readonly string[],
): void {
  const command = argv[2]
  if (!command || command.startsWith('-') || commandNames.includes(command)) {
    return
  }

  const matches = commandNames.filter(name => name.startsWith(command))
  if (matches.length === 1) {
    argv[2] = matches[0]
  }
}
