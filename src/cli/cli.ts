#!/usr/bin/env node

import {VirmatorCliCommandError} from '../errors/cli-command-error';
import {CliFlagError} from '../errors/cli-flag-error';
import {CliFlagName, extractCliFlags} from './cli-util/cli-flags';
import {cliErrorMessages, getResultMessage} from './cli-util/cli-messages';
import {CliCommand, validateCliCommand} from './commands/cli-command';
import {runCommand} from './commands/run-command';

export async function cli(rawArgs: string[]) {
    try {
        const {flags, invalidFlags, args} = extractCliFlags(rawArgs);

        if (invalidFlags.length) {
            throw new CliFlagError(invalidFlags);
        }

        const cliCommand = flags[CliFlagName.Help] ? CliCommand.Help : args[0];
        if (!cliCommand) {
            throw new VirmatorCliCommandError(cliErrorMessages.missingCliCommand);
        }
        if (!validateCliCommand(cliCommand)) {
            throw new VirmatorCliCommandError(cliErrorMessages.invalidCliCommand(cliCommand));
        }

        if (cliCommand !== CliCommand.Help && !flags[CliFlagName.Silent]) {
            console.info(`running ${cliCommand}...`);
        }
        const commandResult = await runCommand(cliCommand, {
            rawArgs: args.slice(1),
            rawCliFlags: flags,
        });

        const exitCode = commandResult.exitCode ?? (commandResult.success ? 0 : 1);

        if (cliCommand !== CliCommand.Help && !flags[CliFlagName.Silent]) {
            console.log(getResultMessage(cliCommand, commandResult.success));
        }

        process.exit(exitCode);
    } catch (error) {
        console.error(String(error));
        process.exit(1);
    }
}

// To run the cli from within this repo itself, use the following bash command:
// node dist/cli/cli.js
// if you haven't compiled you'll also need to run npm run compile beforehand (and after all changes)
if (require.main === module) {
    cli(process.argv.slice(2));
} else {
    throw new Error(`${__filename} should not be imported directly.`);
}
