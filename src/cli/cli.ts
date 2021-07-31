#!/usr/bin/env node

import {VirmatorCliCommandError} from '../errors/cli-command-error';
import {CliFlagError} from '../errors/cli-flag-error';
import {validateCliCommand} from './cli-command';
import {cliErrorMessages, getResultMessage} from './cli-messages';
import {runCommand} from './command-functions/all-command-functions';
import {CliFlagName, extractCliFlags} from './flags';

export async function cli(rawArgs: string[]) {
    try {
        const {flags, invalidFlags, args} = extractCliFlags(rawArgs);

        if (invalidFlags.length) {
            throw new CliFlagError(invalidFlags);
        }

        const cliCommand = args[0];
        if (!cliCommand) {
            throw new VirmatorCliCommandError(cliErrorMessages.missingCliCommand);
        }
        if (!validateCliCommand(cliCommand)) {
            throw new VirmatorCliCommandError(cliErrorMessages.invalidCliCommand(cliCommand));
        }
        const commandResult = await runCommand(cliCommand, {
            rawArgs: args.slice(1),
            cliFlags: flags,
        });

        const exitCode = commandResult.code ?? (commandResult.success ? 0 : 1);

        if (!flags[CliFlagName.Silent]) {
            console.log(getResultMessage(cliCommand, commandResult));
        }

        process.exit(exitCode);
    } catch (error) {
        console.error(String(error));
        process.exit(1);
    }
}

if (require.main === module) {
    cli(process.argv.slice(2));
} else {
    throw new Error(`${__filename} should not be imported directly.`);
}
