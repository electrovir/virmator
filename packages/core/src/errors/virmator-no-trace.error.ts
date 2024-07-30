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
