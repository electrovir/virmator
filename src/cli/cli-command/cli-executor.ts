import {DefineCliCommandInputs} from './cli-define-cli-command-input';
import {CliLogging} from './cli-logging';

export type CliCommandExecutorInputs<InputsGeneric extends DefineCliCommandInputs> = {
    filteredInputArgs: string[];
    inputSubCommands: (keyof InputsGeneric['subCommandDescriptions'])[];
    repoDir: string;
    logging: CliLogging;
};

export type CliCommandExecutor<InputsGeneric extends DefineCliCommandInputs> = (
    inputs: CliCommandExecutorInputs<InputsGeneric>,
) => Promise<CliCommandExecutorOutput> | CliCommandExecutorOutput;

export type CliCommandExecutorOutput = {
    success: boolean;
};
