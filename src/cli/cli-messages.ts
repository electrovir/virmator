import {Color} from './cli-color';
import {CliCommandName} from './cli-command/cli-command-name';
import {CliFlagName} from './cli-flags/cli-flag-name';

export const cliErrorMessages = {
    missingCliCommand: `Missing a command for virmator. Run "virmator help" for details.`,
    unsupportedCliFlag(command: CliCommandName, unsupportedFlagNames: CliFlagName[]) {
        return `The ${command} command does not support the following flags: ${unsupportedFlagNames.join(
            ', ',
        )}`;
    },
};

export function getResultMessage(commandName: CliCommandName, success: boolean) {
    const specificColor = success ? Color.Success : Color.Fail;
    const specificPhrase = success ? 'succeeded' : 'failed';

    return `${Color.Bold}${specificColor}${commandName} ${specificPhrase}.${Color.Reset}`;
}
