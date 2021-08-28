import {Color} from './cli-color';
import {CliCommandName} from './cli-command-name';
import {CliFlagName} from './cli-flags';

export const cliErrorMessages = {
    missingCliCommand: `Missing a command for virmator.`,
    invalidCliCommand(commandArg: any) {
        return `Invalid command passed: ${commandArg}`;
    },
    unsupportedCliFlag(command: CliCommandName, unsupportedFlagNames: CliFlagName[]) {
        return `The ${command} command does not support: ${unsupportedFlagNames.join(', ')}`;
    },
};

export function getResultMessage(command: CliCommandName, success: boolean) {
    if (success) {
        return `${Color.Bold}${Color.Success}${command} succeeded.${Color.Reset}`;
    } else {
        return `${Color.Bold}${Color.Fail}${command} failed.${Color.Reset}`;
    }
}
