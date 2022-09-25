import {
    getEnumTypedKeys,
    getObjectTypedKeys,
    isObject,
    Overwrite,
    typedHasOwnProperty,
} from 'augment-vir';

export function filterObject<T extends object>(
    fullObject: Readonly<T>,
    callback: (value: T[keyof T], key: keyof T, fullObject: Readonly<T>) => boolean,
): Partial<T> {
    return getEnumTypedKeys(fullObject).reduce((accum, key) => {
        const value = fullObject[key];
        if (callback(value, key, fullObject)) {
            accum[key] = value;
        }
        return accum;
    }, {} as Partial<T>);
}

export function deeplyCombineObjects<
    OriginalObjectGeneric extends object,
    OverwriteObjectGeneric extends object,
>(
    originalObject: OriginalObjectGeneric,
    overwriteObject: OverwriteObjectGeneric,
): Overwrite<OriginalObjectGeneric, OverwriteObjectGeneric> {
    return getObjectTypedKeys(overwriteObject).reduce((accum, currentKey) => {
        const currentNewValue = overwriteObject[currentKey];
        const currentOldValue =
            typedHasOwnProperty(originalObject, currentKey) && originalObject[currentKey];
        if (isObject(currentOldValue) && isObject(currentNewValue)) {
            accum[currentKey] = deeplyCombineObjects(currentOldValue, currentNewValue) as any;
        } else {
            accum[currentKey] = currentNewValue as any;
        }
        return accum;
    }, originalObject as unknown as Overwrite<OriginalObjectGeneric, OverwriteObjectGeneric>);
}
