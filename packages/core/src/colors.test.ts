import {describe, it} from 'node:test';
import {assertRunTimeType} from 'run-time-assertions';
import {getTerminalColor, terminalColors} from './colors.js';

describe(getTerminalColor.name, () => {
    it('gets a color', () => {
        assertRunTimeType(getTerminalColor(0), 'string');
    });
    it('gets a color out of range', () => {
        assertRunTimeType(getTerminalColor(terminalColors.length * 2), 'string');
    });
});
