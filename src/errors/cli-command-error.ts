import {getEnumTypedValues} from '../augments/object';
import {CliCommand} from '../cli/cli-command';

export class CliCommandError extends Error {
    public readonly name = 'CliCommandError';
    constructor(message: string) {
        super(`${message}\nExpected one of: ${getEnumTypedValues(CliCommand).join(',')}`);
    }
}
