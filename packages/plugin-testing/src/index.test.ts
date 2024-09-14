import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import * as pluginTestingExports from './index.js';

describe('index file', () => {
    it('exports testPlugin', () => {
        assert.deepEquals(Object.keys(pluginTestingExports).includes('testPlugin'), true);
    });
});
