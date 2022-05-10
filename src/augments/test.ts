import {assert} from 'chai';
import {Constructor} from './type';

export function assertInstanceOf<T>(
    input: unknown,
    classConstructor: Constructor<T>,
): asserts input is T {
    assert.instanceOf(input, classConstructor);
}
