#!/usr/bin/env node

import {extractErrorMessage} from 'augment-vir';
import {VirmatorCliCommandError} from '../errors/cli-command-error';
import {CliFlagError} from '../errors/cli-flag-error';
import {CliCommandName} from './cli-command/cli-command-name';
import {CliFlagName} from './cli-flags/cli-flag-name';
import {cliErrorMessages, getResultMessage} from './cli-shared/cli-messages';
import {parseArguments} from './parse-arguments';
import {runCommand} from './run-cli-command';

export async function cli(rawArgs: string[]) {
    try {
        const {flags, invalidFlags, args, command} = parseArguments(rawArgs);

        if (invalidFlags.length) {
            throw new CliFlagError(invalidFlags);
        }

        const cliCommand = flags[CliFlagName.Help] ? CliCommandName.Help : command;
        if (!cliCommand) {
            throw new VirmatorCliCommandError(cliErrorMessages.missingCliCommand);
        }

        const shouldLogStatus = cliCommand !== CliCommandName.Help && !flags[CliFlagName.Silent];

        if (shouldLogStatus) {
            console.info(`running ${cliCommand}...`);
        }
        const commandResult = await runCommand(cliCommand, {
            otherArgs: args,
            cliFlags: flags,
        });

        if (shouldLogStatus) {
            console.info(getResultMessage(cliCommand, commandResult.success));
        }

        process.exit(commandResult.success ? 0 : 1);
    } catch (error) {
        console.error(extractErrorMessage(error));
        process.exit(1);
    }
}

// To run the cli from within this repo itself, use the following bash command:
// node dist/cli/cli.js
if (require.main === module) {
    cli(process.argv.slice(2));
} else {
    throw new Error(
        `${__filename} should not be imported directly. To run the cli from within the Virmator repo itself, use the following bash command: node dist/cli/cli.js`,
    );
}
