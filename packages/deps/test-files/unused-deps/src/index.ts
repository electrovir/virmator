import mri from 'mri';
import mriSubpath from 'mri/lib/index.js';

export function parseArgs(args: ReadonlyArray<string>) {
    return [
        mri(args),
        mriSubpath(args),
    ];
}
