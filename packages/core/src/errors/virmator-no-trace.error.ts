/**
 * An error that aborts execution but should not get stack traced: only the error message should get
 * logged.
 */
export class VirmatorNoTraceError extends Error {
    public override readonly name = 'VirmatorNoTraceError';

    constructor(message = '') {
        super(message);
    }
}

/**
 * Used for debugging. Set to `false` to see error traces. Should always be set back to `true` for
 * publishing.
 */
export const hideNoTraceTraces = true as boolean;
