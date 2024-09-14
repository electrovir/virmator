import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import * as indexExports from './index.js';

describe('index', () => {
    it('exports expected stuff', () => {
        assert.isDefined(indexExports.generateHelpMessage);
        assert.isDefined(indexExports.virmatorHelpPlugin);
    });
});
