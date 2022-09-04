import {ConfigFileDefinition} from '../config/config-file-definition';
import {CommandLogTransforms} from './command-logging';
import {
    DefineCommandInputs,
    SharedExecutorInputsAndCommandDefinition,
} from './define-command-inputs';

export type CommandExecutorInputs<
    DefineCommandInputsGeneric extends DefineCommandInputs = DefineCommandInputs,
> = {
    filteredInputArgs: string[];
    inputSubCommands: (keyof DefineCommandInputsGeneric['subCommandDescriptions'])[];
    repoDir: string;
    allConfigs: ConfigFileDefinition[];
} & SharedExecutorInputsAndCommandDefinition<DefineCommandInputsGeneric>;

export type DetailedArg = {
    arg: string;
    skipWindowsInterpolation: true;
};

export type SuccessOnlyExecutorOutput = {
    // for use when the script is just a TS script, it's not run in a shell
    success: boolean;
};
export type BashCommandExecutorOutput = {
    mainCommand: string;
    logTransforms?: CommandLogTransforms;
    args: (string | DetailedArg)[];
};

export function isCompletedExecutor(
    executorOutput: CommandExecutorOutput,
): executorOutput is SuccessOnlyExecutorOutput {
    return 'success' in executorOutput;
}

export type CommandExecutorOutput = BashCommandExecutorOutput | SuccessOnlyExecutorOutput;

export type CommandExecutor<DefineCommandInputsGeneric extends DefineCommandInputs> = (
    inputs: CommandExecutorInputs<DefineCommandInputsGeneric>,
) => Promise<CommandExecutorOutput> | CommandExecutorOutput;
