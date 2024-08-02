import {describe, it} from 'node:test';
import {assertDefined} from 'run-time-assertions';
import * as indexExports from './index';

describe('index', () => {
    it('exports expected stuff', () => {
        assertDefined(indexExports.generateHelpMessage);
        assertDefined(indexExports.virmatorHelpPlugin);
    });
});
