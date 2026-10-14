#!/usr/bin/env node

import {Command} from 'commander'
import {create} from './index.js'
import {expandCommandAbbreviation} from './commandAbbreviation.js'
import type {Framework} from './examples/samples/types.js'

interface ExampleOptions {
  react?: boolean
  core?: boolean
}

const program = new Command()

program
  .name('teaui')
  .description('CLI for creating TeaUI applications')
  .version('1.2.1')

program
  .command('example')
  .description('Show TeaUI component examples')
  .argument('[name]', 'Example name or unique abbreviation')
  .option('--react', 'Show the @teaui/react example (default)')
  .option('--core', 'Show the @teaui/core example')
  .action(async (name: string | undefined, options: ExampleOptions) => {
    try {
      const framework = exampleFramework(options)
      const {listExamples, showExample} = await import('./examples.js')
      process.stdout.write(
        name
          ? await showExample(name, framework)
          : listExamples(options.react || options.core ? framework : undefined),
      )
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error))
      process.exitCode = 1
    }
  })

program
  .command('create')
  .description('Create a new TeaUI application')
  .argument('<name>', 'Name of the application')
  .requiredOption(
    '-f, --framework <framework> (none, react)',
    'Framework to use',
    value => {
      if (!['react', 'none'].includes(value)) {
        throw new Error(
          `Invalid framework: ${value}. Must be one of: react, none`,
        )
      }
      return value
    },
  )
  .action(async (name: string, options: {framework: string}) => {
    try {
      await create(name, options)
    } catch (error) {
      console.error(`Error creating application: ${error}`)
      process.exit(1)
    }
  })

expandCommandAbbreviation(
  process.argv,
  program.commands.map(command => command.name()),
)
program.parse()

function exampleFramework(options: ExampleOptions): Framework {
  if (options.react && options.core) {
    throw new Error('Choose either --react or --core, not both.')
  }
  return options.core ? 'core' : 'react'
}
