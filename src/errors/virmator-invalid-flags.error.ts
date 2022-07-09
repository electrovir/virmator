import {getObjectTypedKeys} from 'augment-vir';
import {fillInCliFlagValues} from '../cli/cli-flags/cli-flag-values';
import {VirmatorCliError} from './virmator-cli.error';

export class VirmatorInvalidFlagsError extends VirmatorCliError {
    public override readonly name = 'VirmatorInvalidFlagsError';
    constructor(invalidFlags: string[]) {
        super(
            `Invalid flags given: ${invalidFlags.join(',')}\nValid flags: ${getObjectTypedKeys(
                fillInCliFlagValues(),
            ).join(',')}`,
        );
    }
}
