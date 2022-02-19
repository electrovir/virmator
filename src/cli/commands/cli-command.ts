import {repoRootDir} from '../../file-paths/repo-paths';
import {CliCommandName} from '../cli-util/cli-command-name';
import {CliFlagName, CliFlags, fillInCliFlags} from '../cli-util/cli-flags';
import {CommandConfigKey} from '../config/config-key';

export type CliCommandResult = {
    command: string | undefined;
    success: boolean;
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

const defaultCommandFunctionInput: Readonly<
    Omit<CommandFunctionInput, 'stdoutCallback' | 'stderrCallback'>
> = {
    rawArgs: [],
    cliFlags: fillInCliFlags(),
    repoDir: repoRootDir,
};

export function fillInCommandInput(
    commandInput?: PartialCommandFunctionInput | Partial<CommandFunctionInput>,
): Omit<CommandFunctionInput, 'stdoutCallback' | 'stderrCallback'> {
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
    stdoutCallback: (stdout: string) => void;
    stderrCallback: (stderr: string) => void;
}>;

export const EmptyOutputCallbacks: Pick<CommandFunctionInput, 'stdoutCallback' | 'stderrCallback'> =
    {
        stdoutCallback: () => {},
        stderrCallback: () => {},
    };

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
