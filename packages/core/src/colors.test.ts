import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {getTerminalColor, terminalColors} from './colors.js';

describe(getTerminalColor.name, () => {
    it('gets a color', () => {
        assert.isString(getTerminalColor(0));
    });
    it('gets a color out of range', () => {
        assert.isString(getTerminalColor(terminalColors.length * 2));
    });
});
