import {CliCommand, CliCommandResult} from './cli-command';
import {Color} from './color';

export const cliErrorMessages = {
    missingCliCommand: `Missing a command for virmator.`,
    invalidCliCommand(commandArg: any) {
        return `Invalid command passed: ${commandArg}`;
    },
};

export function printResultMessage(command: CliCommand, result: CliCommandResult) {
    if (result.success) {
        console.info(`${Color.Bold}${Color.Success}${command} succeeded.${Color.Reset}`);
    } else {
        console.info(`${Color.Bold}${Color.Fail}${command} failed.${Color.Reset}`);
    }
}
