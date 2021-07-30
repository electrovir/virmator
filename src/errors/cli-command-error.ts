import {getEnumTypedValues} from '../augments/object';
import {CliCommand} from '../cli/cli-command';

export class VirmatorCliCommandError extends Error {
    public readonly name = 'VirmatorCliCommandError';
    constructor(message: string) {
        super(
            `${message}\nExpected one of the following: ${getEnumTypedValues(CliCommand).join(
                ', ',
            )}`,
        );
    }
}
