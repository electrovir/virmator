import {AnyObject, isLengthAtLeast} from '@augment-vir/common';

export function accessAtKeys<T extends AnyObject>(
    parent: Readonly<AnyObject>,
    keys: ReadonlyArray<PropertyKey>,
): T | undefined {
    if (!parent) {
        return undefined;
    } else if (!isLengthAtLeast(keys, 1)) {
        return parent;
    } else {
        return accessAtKeys(parent[keys[0]], keys.slice(1));
    }
}
