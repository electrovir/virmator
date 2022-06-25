export type LogCallback = (thingToLog: string) => void;

export type CliLogging = {
    stdout: LogCallback;
    stderr: LogCallback;
};
export const noCliLogging: Readonly<Required<CliLogging>> = {
    stderr: () => {},
    stdout: () => {},
};

export type CliLogs = Record<keyof CliLogging, string>;

export const noLogTransforms: LogTransform = (input) => input;
export type LogTransform = (thingToTransform: string) => string;

export type LogTransforms = Partial<Record<keyof CliLogging, LogTransform>>;
