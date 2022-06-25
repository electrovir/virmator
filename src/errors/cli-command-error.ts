export class VirmatorCliCommandError extends Error {
    public override readonly name = 'VirmatorCliCommandError';
    constructor(message: string, allowedCommands: string[]) {
        super(`${message}\nExpected one of the following: ${allowedCommands.join(', ')}`);
    }
}
