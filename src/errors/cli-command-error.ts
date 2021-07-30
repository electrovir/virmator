import {getEnumTypedValues} from '../augments/object';
import {CliCommand} from '../cli/commands';

export class CliCommandError extends Error {
    public readonly name = 'CliCommandError';
    constructor(message: string) {
        super(`${message}\nExpected one of: ${getEnumTypedValues(CliCommand).join(',')}`);
    }
}
