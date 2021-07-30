import {getEnumTypedValues} from '../augments/object';
import {CliFlags} from './flags';

export enum CliCommand {
    Format = 'format',
    SpellCheck = 'spellcheck',
    Test = 'test',
    Help = 'help',
    UpdateConfigs = 'update-configs',
}

export type CliCommandResult = {
    success: boolean;
    code?: number;
};

export type CommandFunction = (
    args?: string[],
    cliFlags?: CliFlags,
    customDir?: string,
) => CliCommandResult | Promise<CliCommandResult>;

export function validateCliCommand(input: any): input is CliCommand {
    return getEnumTypedValues(CliCommand).includes(input);
}
