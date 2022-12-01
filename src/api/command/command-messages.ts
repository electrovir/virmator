import {logColors} from '@augment-vir/node-js';

export function getCommandResultMessage(commandName: string, success: boolean) {
    const specificColor = success ? logColors.success : logColors.error;
    const specificPhrase = success ? 'succeeded' : 'failed';

    return `${logColors.bold}${specificColor}${commandName} ${specificPhrase}.${logColors.reset}`;
}
