import {getObjectTypedKeys, isObject, Overwrite, typedHasOwnProperty} from 'augment-vir';

export function filterObject<T extends object>(
    fullObject: Readonly<T>,
    callback: (value: T[keyof T], key: keyof T, fullObject: Readonly<T>) => boolean,
): Partial<T> {
    return getObjectTypedKeys(fullObject).reduce((accum, key) => {
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

export function filterToDifferentValues<T extends object>(
    baseObject: T,
    changedObject: T,
): Partial<T> {
    return getObjectTypedKeys(baseObject).reduce((accum, key) => {
        const beforeValue = baseObject[key];
        const afterValue = changedObject[key];

        if (isObject(beforeValue) && isObject(afterValue)) {
            const innerDiff = filterToDifferentValues(beforeValue, afterValue);
            if (Object.keys(innerDiff).length) {
                accum[key] = filterToDifferentValues(beforeValue, afterValue) as T[keyof T];
            }
        } else if (beforeValue !== afterValue) {
            accum[key] = afterValue;
        }

        return accum;
    }, {} as Partial<T>);
}
