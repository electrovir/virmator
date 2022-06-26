import {getObjectTypedKeys, mapObject} from 'augment-vir';
import {CliLogging} from '../../logging';
import {ConfigFileDefinition} from '../config/config-files';
import {CliCommandDescription} from './cli-command-help';

export type CliCommandExecutorInputs<
    InputsGeneric extends DefineCliCommandInputs = DefineCliCommandInputs,
> = {
    filteredInputArgs: string[];
    inputSubCommands: (keyof InputsGeneric['subCommandDescriptions'])[];
    repoDir: string;
    logging: CliLogging;
};

export type FullCliCommandExecutorInputs<InputsGeneric extends DefineCliCommandInputs> = {
    filteredInputArgs: string[];
    inputSubCommands: (keyof InputsGeneric['subCommandDescriptions'])[];
    repoDir: string;
    logging: CliLogging;
} & SharedExecutorInputsAndCommandDefinition<InputsGeneric>;

export type CliCommandExecutor<InputsGeneric extends DefineCliCommandInputs> = (
    inputs: CliCommandExecutorInputs<InputsGeneric>,
) => Promise<CliCommandExecutorOutput> | CliCommandExecutorOutput;

export type FullCliCommandExecutor<InputsGeneric extends DefineCliCommandInputs> = (
    inputs: FullCliCommandExecutorInputs<InputsGeneric>,
) => Promise<CliCommandExecutorOutput> | CliCommandExecutorOutput;

export type CliCommandExecutorOutput = {
    fullExecutedCommand: string;
    success: boolean;
};

export type DefineCliCommandInputs<CommandName extends string = string> = Readonly<{
    commandName: CommandName;
    subCommandDescriptions: Readonly<Record<string, string>>;
    requiredConfigFiles: Readonly<ConfigFileDefinition[]>;
}>;

type SubCommandsMap<InputsGeneric extends DefineCliCommandInputs> = {
    [Prop in keyof InputsGeneric['subCommandDescriptions']]: Prop;
};

type SharedExecutorInputsAndCommandDefinition<InputsGeneric extends DefineCliCommandInputs> =
    InputsGeneric & {
        allAvailableSubCommands: (keyof InputsGeneric['subCommandDescriptions'])[];
        subCommands: SubCommandsMap<InputsGeneric>;
    };

export type CliCommandDefinition<
    InputsGeneric extends DefineCliCommandInputs = DefineCliCommandInputs,
> = SharedExecutorInputsAndCommandDefinition<InputsGeneric> & {
    executor: CliCommandExecutor<InputsGeneric>;
    commandDescription: CliCommandDescription;
};

type CreateDescriptionsInputs<InputsGeneric extends DefineCliCommandInputs> = Pick<
    InputsGeneric,
    'commandName'
> & {
    subCommands: SubCommandsMap<InputsGeneric>;
};

type CreateDescriptionsCallback<InputsGeneric extends DefineCliCommandInputs> = (
    inputs: CreateDescriptionsInputs<InputsGeneric>,
) => CliCommandDescription;

export function defineCliCommand<InputsGeneric extends DefineCliCommandInputs>(
    inputs: Readonly<InputsGeneric>,
    createDescription: CreateDescriptionsCallback<InputsGeneric>,
    inputExecutor: FullCliCommandExecutor<InputsGeneric>,
): CliCommandDefinition<InputsGeneric> {
    const allAvailableSubCommands: (keyof InputsGeneric['subCommandDescriptions'])[] =
        getObjectTypedKeys(inputs.subCommandDescriptions);
    const subCommands: SubCommandsMap<InputsGeneric> = mapObject(
        inputs.subCommandDescriptions,
        (key) => key,
    ) as SubCommandsMap<InputsGeneric>;

    const init: SharedExecutorInputsAndCommandDefinition<InputsGeneric> = {
        ...inputs,
        allAvailableSubCommands,
        subCommands,
    };

    const executor: CliCommandExecutor<InputsGeneric> = (executorInputs) => {
        return inputExecutor({
            ...executorInputs,
            ...init,
        });
    };

    const commandDescription = createDescription({
        commandName: init.commandName,
        subCommands: init.subCommands,
    });

    return {
        ...init,
        commandDescription,
        executor,
    };
}
