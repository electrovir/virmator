import {CliCommand, CliCommandResult} from './cli-command';
import {Color} from './color';

export const cliErrorMessages = {
    missingCliCommand: `Missing a command for virmator.`,
    invalidCliCommand(commandArg: any) {
        return `Invalid command passed: ${commandArg}`;
    },
};

export function getResultMessage(command: CliCommand, result: CliCommandResult) {
    if (result.success) {
        return `${Color.Bold}${Color.Success}${command} succeeded.${Color.Reset}`;
    } else {
        return `${Color.Bold}${Color.Fail}${command} failed.${Color.Reset}`;
    }
}
