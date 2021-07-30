import {getEnumTypedValues} from '../augments/object';

export enum CliCommand {
    Format = 'format',
    SpellCheck = 'spellcheck',
    Test = 'test',
    Help = 'help',
}

export type CliCommandResult = {
    success: boolean;
    code?: number;
};

export type CommandFunction = (inputs: string[]) => CliCommandResult | Promise<CliCommandResult>;

export const cliCommands: Record<CliCommand, CommandFunction> = {
    [CliCommand.Format]: () => {
        return {success: true};
    },
    [CliCommand.SpellCheck]: () => {
        return {success: true};
    },
    [CliCommand.Test]: () => {
        return {success: true};
    },
    [CliCommand.Help]: () => {
        return {success: true};
    },
};

export function validateCliCommand(input: any): input is CliCommand {
    return input in getEnumTypedValues(CliCommand);
}
