import {getEnumTypedValues} from '../../augments/object';
import {CliFlags} from '../cli-util/cli-flags';
import {ConfigFile} from '../config/configs';

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

export type CommandFunctionInput = {
    rawArgs?: string[];
    cliFlags?: Partial<CliFlags>;
    customDir?: string;
};

export type CliCommandImplementation = {
    configFile?: ConfigFile;
    description: string;
    implementation: CommandFunction;
};

export type CommandFunction = (
    input: CommandFunctionInput,
) => CliCommandResult | Promise<CliCommandResult>;

export function validateCliCommand(input: any): input is CliCommand {
    return getEnumTypedValues(CliCommand).includes(input);
}
