import {ArrayElement} from '@augment-vir/common';

export const terminalColors = [
    // Text colors
    'cyan',
    'yellow',
    'greenBright',
    'blueBright',
    'magentaBright',
    'grey',
    'red',
    // Background colors
    'bgCyan',
    'bgYellow',
    'bgGreenBright',
    'bgBlueBright',
    'bgMagenta',
    'bgWhiteBright',
    'bgGrey',
    'bgRed',
] as const;

export type TerminalColor = ArrayElement<typeof terminalColors>;

export function getTerminalColor(index: number): TerminalColor {
    return terminalColors[index % terminalColors.length]!;
}
