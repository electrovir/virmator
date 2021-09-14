export function combineErrors(errors: [Error, ...Error[]]): Error;
export function combineErrors(errors: never[]): undefined;
export function combineErrors(errors: Error[]): Error | undefined;
export function combineErrors(errors?: undefined): undefined;
export function combineErrors(errors?: Error[]): Error | undefined {
    if (!errors || errors.length === 0) {
        return undefined;
    }
    const firstError = errors[0];
    if (errors.length === 1 && firstError) {
        return firstError;
    }
    return new Error(errors.map((error) => error.message.trim()).join('\n'));
}
