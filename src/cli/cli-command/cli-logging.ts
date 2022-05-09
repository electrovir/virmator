export type LogCallback = (thingToLog: string) => void;

export type CliLogging = {
    stdout: LogCallback;
    stderr: LogCallback;
};

export const noTransform: LogTransform = (input) => input;
export type LogTransform = (thingToTransform: string) => string;
export type LogTransforms = {
    stdout: LogTransform;
    stderr: LogTransform;
};
