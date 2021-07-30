import {getObjectTypedKeys} from '../augments/object';
import {defaultCliFlags} from '../cli/flags';

export class CliFlagError extends Error {
    public readonly name = 'CliFlagError';
    constructor(invalidFlags: string[]) {
        super(
            `Invalid flags given: ${invalidFlags.join(',')}\nValid flags: ${getObjectTypedKeys(
                defaultCliFlags,
            )
                .map((flag) => `--${flag}`)
                .join(',')}`,
        );
    }
}
