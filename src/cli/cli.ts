#!/usr/bin/env node

import {extractErrorMessage} from 'augment-vir';
import {VirmatorInvalidCommandError} from '../errors/virmator-invalid-command.error';
import {VirmatorInvalidFlagsError} from '../errors/virmator-invalid-flags.error';
import {allCliCommandDefinitions, builtInCommandNames} from './all-cli-command-definitions';
import {CliFlagName} from './cli-flags/cli-flag-name';
import {cliErrorMessages, getResultMessage} from './cli-messages';
import {parseArguments} from './parse-arguments';
import {runCommand} from './run-cli-command';

export async function cli(rawArgs: string[]) {
    try {
        const {flags, invalidFlags, args, commandName} = parseArguments(rawArgs);

        const cliCommandName = flags[CliFlagName.Help] ? builtInCommandNames.help : commandName;
        if (!cliCommandName) {
            throw new VirmatorInvalidCommandError(
                cliErrorMessages.missingCliCommand,
                Object.values(builtInCommandNames),
            );
        }

        if (invalidFlags.length) {
            throw new VirmatorInvalidFlagsError(invalidFlags);
        }

        const shouldLogStatus =
            cliCommandName !== builtInCommandNames.help && !flags[CliFlagName.Silent];

        if (shouldLogStatus) {
            console.info(`running ${cliCommandName}...`);
        }

        const commandDefinition = allCliCommandDefinitions[cliCommandName];

        if (!commandDefinition) {
            throw new Error(cliErrorMessages.commandNotFound(cliCommandName));
        }

        const commandResult = await runCommand(commandDefinition, {
            otherArgs: args,
            cliFlags: flags,
            repoDir: process.cwd(),
        });

        if (shouldLogStatus) {
            console.info(getResultMessage(cliCommandName, commandResult.success));
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
