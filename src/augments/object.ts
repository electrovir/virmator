export function getEnumTypedKeys<T>(input: T): (keyof T)[] {
    // keys are always strings
    return getObjectTypedKeys(input).filter((key) => isNaN(Number(key))) as (keyof T)[];
}

export function getEnumTypedValues<T>(input: T): T[keyof T][] {
    const keys = getEnumTypedKeys(input);
    return keys.map((key) => input[key]);
}

export function isEnumValue<T>(input: any, checkEnum: T): input is T[keyof T] {
    return getEnumTypedValues(checkEnum).includes(input);
}

export function getObjectTypedKeys<T>(input: T): (keyof T)[] {
    return Object.keys(input) as (keyof T)[];
}

export function getObjectTypedValues<T>(input: T): T[keyof T][] {
    return Object.values(input) as T[keyof T][];
}
