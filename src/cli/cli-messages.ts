import {Color} from './cli-color';

export const cliErrorMessages = {
    missingCliCommand: `Missing a command for virmator. Run "virmator help" for details.`,
    commandNotFound(commandName: string) {
        return `No command found by the name of "${commandName}"`;
    },
};

export function getResultMessage(commandName: string, success: boolean) {
    const specificColor = success ? Color.Success : Color.Fail;
    const specificPhrase = success ? 'succeeded' : 'failed';

    return `${Color.Bold}${specificColor}${commandName} ${specificPhrase}.${Color.Reset}`;
}
