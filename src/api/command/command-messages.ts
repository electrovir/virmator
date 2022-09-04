import {Color} from '../cli-color';

export function getCommandResultMessage(commandName: string, success: boolean) {
    const specificColor = success ? Color.Success : Color.Fail;
    const specificPhrase = success ? 'succeeded' : 'failed';

    return `${Color.Bold}${specificColor}${commandName} ${specificPhrase}.${Color.Reset}`;
}
