import {AnyObject, isLengthAtLeast} from '@augment-vir/common';

/** Gets the nested value within an object with the provided chain of keys. */
export function accessAtKeys<T extends AnyObject>(
    parent: Readonly<AnyObject> | undefined,
    keys: ReadonlyArray<PropertyKey>,
): T | undefined {
    if (!parent) {
        return undefined;
    } else if (isLengthAtLeast(keys, 1)) {
        return accessAtKeys(parent[keys[0]], keys.slice(1));
    } else {
        return parent;
    }
}
