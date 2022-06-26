import {getEnumTypedKeys} from 'augment-vir';

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
