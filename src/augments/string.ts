import {ansiRegex} from './ansi-regex';

export function stripColor(input: string): string {
    return input.replace(ansiRegex, '');
}
