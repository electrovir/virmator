import {getObjectTypedKeys} from 'augment-vir';
import {defaultCliFlags} from '../cli/cli-util/cli-flags';

export class CliFlagError extends Error {
    public override readonly name = 'CliFlagError';
    constructor(invalidFlags: string[]) {
        super(
            `Invalid flags given: ${invalidFlags.join(',')}\nValid flags: ${getObjectTypedKeys(
                defaultCliFlags,
            ).join(',')}`,
        );
    }
}
