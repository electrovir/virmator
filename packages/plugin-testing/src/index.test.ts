import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import * as pluginTestingExports from './index.js';

describe('index file', () => {
    it('exports testPlugin', () => {
        assert.deepStrictEqual(Object.keys(pluginTestingExports).includes('testPlugin'), true);
    });
});
