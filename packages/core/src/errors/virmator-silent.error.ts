/** An error that isn't meant to log a stack trace because another process already logged it. */
export class VirmatorSilentError extends Error {
    public override readonly name = 'VirmatorSilentError';

    constructor() {
        super();
    }
}
