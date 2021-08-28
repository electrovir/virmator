import {getEnumTypedValues} from '../../augments/object';
import {CliFlagName, CliFlags, fillInCliFlags} from '../cli-util/cli-flags';
import {CommandConfigKey} from '../config/configs';

export enum CliCommand {
    Compile = 'compile',
    Format = 'format',
    Help = 'help',
    SpellCheck = 'spellcheck',
    Test = 'test',
    UpdateAllConfigs = 'update-all-configs',
    UpdateBareConfigs = 'update-bare-configs',
}

export type CliCommandResult = {
    success: boolean;
    stdout: string;
    stderr: string;
    error?: any;
    exitCode?: number;
};

function extractRawFlags(
    commandInput?: PartialCommandFunctionInput | Partial<CommandFunctionInput>,
): Partial<Readonly<CliFlags>> | undefined {
    if (!commandInput) {
        return undefined;
    } else if ('cliFlags' in commandInput) {
        return commandInput.cliFlags;
    } else if ('rawCliFlags' in commandInput) {
        return commandInput.rawCliFlags;
    } else {
        return undefined;
    }
}

export function fillInCommandInput(
    commandInput?: PartialCommandFunctionInput | Partial<CommandFunctionInput>,
): CommandFunctionInput {
    if (!commandInput) {
        return {
            rawArgs: [],
            cliFlags: fillInCliFlags(),
        };
    }

    const rawCliFlags = extractRawFlags(commandInput);

    return {
        rawArgs: commandInput?.rawArgs || [],
        cliFlags: fillInCliFlags(rawCliFlags),
        customDir: commandInput.customDir,
    };
}

export type CommandFunctionInput = Readonly<{
    rawArgs: string[];
    cliFlags: Required<Readonly<CliFlags>>;
    customDir?: string | undefined;
}>;

export type PartialCommandFunctionInput = Omit<Partial<CommandFunctionInput>, 'cliFlags'> & {
    rawCliFlags?: Partial<Readonly<CliFlags>>;
};

export type CliCommandImplementation = Readonly<{
    commandName: CliCommand;
    configKeys?: CommandConfigKey[];
    description: string;
    implementation: CommandFunction;
    configFlagSupport: Readonly<
        Omit<
            Record<CliFlagName, boolean>,
            CliFlagName.Silent | CliFlagName.Help | CliFlagName.ExtendableConfig
        >
    >;
}>;

export type CommandFunction = (
    input: CommandFunctionInput,
) => CliCommandResult | Promise<CliCommandResult>;

export function validateCliCommand(input: any): input is CliCommand {
    return getEnumTypedValues(CliCommand).includes(input);
}
