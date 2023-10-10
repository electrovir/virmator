import {MaybePromise} from '@augment-vir/common';
import {ConfigFileDefinition} from '../config/config-file-definition';
import {CommandLogging, CommandLogTransforms} from './command-logging';
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
    allConfigs: ReadonlyArray<ConfigFileDefinition>;
    packageDir: string;
    logging: CommandLogging;
    packageBinName: string;
};

export type CommandExecutorDefinitionInputs<
    DefineCommandInputsGeneric extends DefineCommandInputs = DefineCommandInputs,
> = CommandExecutorInputs<DefineCommandInputsGeneric> &
    SharedExecutorInputsAndCommandDefinition<DefineCommandInputsGeneric>;

export type DetailedArg = {
    arg: string;
    skipWindowsInterpolation: true;
};

export type SuccessOnlyExecutorOutput = {
    // for use when the script is just a TS script, it's not run in a shell
    success: boolean;
};
export type BashCommandExecutorOutput = {
    logTransforms?: CommandLogTransforms;
    args: (string | DetailedArg)[];
    postExecute?: () => MaybePromise<void>;
};

export function isCompletedExecutor(
    executorOutput: CommandExecutorOutput,
): executorOutput is SuccessOnlyExecutorOutput {
    return 'success' in executorOutput;
}

export type CommandExecutorOutput = BashCommandExecutorOutput | SuccessOnlyExecutorOutput;

export type CommandExecutorDefinition<DefineCommandInputsGeneric extends DefineCommandInputs> = (
    inputs: CommandExecutorDefinitionInputs<DefineCommandInputsGeneric>,
) => Promise<CommandExecutorOutput> | CommandExecutorOutput;

export type CommandExecutor<DefineCommandInputsGeneric extends DefineCommandInputs> = (
    inputs: CommandExecutorInputs<DefineCommandInputsGeneric>,
) => Promise<CommandExecutorOutput> | CommandExecutorOutput;
