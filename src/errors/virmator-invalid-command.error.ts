import {VirmatorCliError} from './virmator-cli.error';

export class VirmatorInvalidCommandError extends VirmatorCliError {
    public override name = 'VirmatorInvalidCommandError';

    constructor(message: string, allowedCommands: string[]) {
        super(`${message}\nExpected one of the following: ${allowedCommands.join(', ')}`);
    }
}
