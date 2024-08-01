import {ArrayElement} from '@augment-vir/common';

/**
 * All terminal colors passed to concurrently and other concurrent operations used within virmator
 * plugins.
 */
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

/** The supported terminal colors for virmator concurrent commands. */
export type TerminalColor = ArrayElement<typeof terminalColors>;

/** Gets a supported virmator terminal color, with support for overflowing indexes. */
export function getTerminalColor(index: number): TerminalColor {
    return terminalColors[index % terminalColors.length]!;
}
