import {getObjectTypedKeys} from 'augment-vir';
import {fillInCliFlagValues} from '../cli/cli-flags/cli-flag-values';

export class CliFlagError extends Error {
    public override readonly name = 'CliFlagError';
    constructor(invalidFlags: string[]) {
        super(
            `Invalid flags given: ${invalidFlags.join(',')}\nValid flags: ${getObjectTypedKeys(
                fillInCliFlagValues(),
            ).join(',')}`,
        );
    }
}
