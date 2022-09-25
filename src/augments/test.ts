import {assert} from 'chai';
import {Constructor} from './type';

export function assertInstanceOf<T>(
    input: unknown,
    classConstructor: Constructor<T>,
    message?: string,
): asserts input is T {
    assert.instanceOf(input, classConstructor, message);
}

export function assertString(input: unknown, message?: string): asserts input is string {
    assert.typeOf(input, 'string', message);
}
