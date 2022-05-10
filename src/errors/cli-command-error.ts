import {getEnumTypedValues} from 'augment-vir';
import {CliCommandName} from '../cli/cli-command/cli-command-name';

export class VirmatorCliCommandError extends Error {
    public override readonly name = 'VirmatorCliCommandError';
    constructor(message: string) {
        super(
            `${message}\nExpected one of the following: ${getEnumTypedValues(CliCommandName).join(
                ', ',
            )}`,
        );
    }
}
