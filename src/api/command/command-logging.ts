export type CommandLogCallback = (thingToLog: string) => void;

export type CommandLogging = {
    stdout: CommandLogCallback;
    stderr: CommandLogCallback;
};
export const noCommandLogging: Readonly<Required<CommandLogging>> = {
    stderr: () => {},
    stdout: () => {},
};

export const defaultConsoleLogging: Readonly<Required<CommandLogging>> = {
    stdout: (input: string) => {
        process.stdout.write(input.replace(/\n$/, '') + '\n');
    },
    stderr: (input: string) => {
        process.stderr.write(input.replace(/\n$/, '') + '\n');
    },
};

export type CommandLogs = Record<keyof CommandLogging, string>;

export const identityCommandLogTransform: CommandLogTransform = (input) => input;
export type CommandLogTransform = (thingToTransform: string) => string;

export type CommandLogTransforms = Partial<Record<keyof CommandLogging, CommandLogTransform>>;
