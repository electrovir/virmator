import assert from 'assert';
import {describe, it} from 'node:test';
import * as pluginTestingExports from './index';

describe('index file', () => {
    it('exports testPlugin', () => {
        assert.deepStrictEqual(Object.keys(pluginTestingExports).includes('testPlugin'), true);
    });
});
