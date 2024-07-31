import {ArrayElement} from '@augment-vir/common';

export const terminalColors = [
    // Text colors
    'red',
    'yellow',
    'greenBright',
    'cyan',
    'blueBright',
    'magentaBright',
    'grey',
] as const;

export type TerminalColor = ArrayElement<typeof terminalColors>;

export function getTerminalColor(index: number): TerminalColor {
    return terminalColors[index % terminalColors.length]!;
}
