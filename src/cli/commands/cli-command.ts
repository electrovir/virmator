import {repoRootDir} from '../../file-paths/repo-paths';
import {CliCommandName} from '../cli-util/cli-command-name';
import {CliFlagName, CliFlags, fillInCliFlags} from '../cli-util/cli-flags';
import {CommandConfigKey} from '../config/config-key';

export type CliCommandResult = {
    success: boolean;
    stdout?: string | undefined;
    stderr?: string | undefined;
    error?: unknown | undefined;
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

const defaultCommandFunctionInput: Readonly<CommandFunctionInput> = {
    rawArgs: [],
    cliFlags: fillInCliFlags(),
    repoDir: repoRootDir,
};

export function fillInCommandInput(
    commandInput?: PartialCommandFunctionInput | Partial<CommandFunctionInput>,
): CommandFunctionInput {
    if (!commandInput) {
        return defaultCommandFunctionInput;
    }

    const rawCliFlags = extractRawFlags(commandInput);

    return {
        rawArgs: commandInput?.rawArgs || defaultCommandFunctionInput.rawArgs,
        cliFlags: fillInCliFlags(rawCliFlags),
        repoDir: commandInput.repoDir || defaultCommandFunctionInput.repoDir,
    };
}

export type CommandFunctionInput = Readonly<{
    rawArgs: string[];
    cliFlags: Required<Readonly<CliFlags>>;
    repoDir: string;
}>;

export type PartialCommandFunctionInput = Omit<Partial<CommandFunctionInput>, 'cliFlags'> & {
    rawCliFlags?: Partial<Readonly<CliFlags>>;
};

export type CliCommandImplementation = Readonly<{
    commandName: CliCommandName;
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
