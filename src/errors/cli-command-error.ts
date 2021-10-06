import {getEnumTypedValues} from 'augment-vir/dist/node';
import {CliCommandName} from '../cli/cli-util/cli-command-name';

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
