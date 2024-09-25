import {check} from '@augment-vir/assert';
import {type AnyObject} from '@augment-vir/common';

/** Gets the nested value within an object with the provided chain of keys. */
export function accessAtKeys<T>(
    parent: Readonly<AnyObject> | undefined,
    keys: ReadonlyArray<PropertyKey>,
): T | undefined {
    if (!parent) {
        return undefined;
    } else if (check.isLengthAtLeast(keys, 1)) {
        return accessAtKeys(parent[keys[0]], keys.slice(1));
    } else {
        return parent;
    }
}
