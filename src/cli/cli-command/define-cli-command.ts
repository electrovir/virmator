import {getObjectTypedKeys, mapObject} from 'augment-vir';
import {CommandConfigKey} from '../config/config-key';
import {CliCommandDescription} from './cli-command-help';
import {CliCommandExecutor} from './cli-executor';

export type DefineCliCommandInputs<CommandName extends string = string> = Readonly<{
    commandName: CommandName;
    supportedConfigKeys: Readonly<CommandConfigKey[]>;
    subCommandDescriptions: Readonly<Record<string, string>>;
    commandDescription: CliCommandDescription;
}>;

export type CliCommandDefinition<
    InputsGeneric extends DefineCliCommandInputs = DefineCliCommandInputs,
> = InputsGeneric & {
    allAvailableSubCommands: (keyof InputsGeneric['subCommandDescriptions'])[];
    executor: CliCommandExecutor<InputsGeneric>;
    subCommands: {[Prop in keyof InputsGeneric['subCommandDescriptions']]: Prop};
};

export function defineCliCommand<InputsGeneric extends DefineCliCommandInputs>(
    inputs: Readonly<InputsGeneric>,
    executor: CliCommandExecutor<InputsGeneric>,
): CliCommandDefinition<InputsGeneric> {
    const allAvailableSubCommands: (keyof InputsGeneric['subCommandDescriptions'])[] =
        getObjectTypedKeys(inputs.subCommandDescriptions);
    const subCommands: {[Prop in keyof InputsGeneric['subCommandDescriptions']]: Prop} = mapObject(
        inputs.subCommandDescriptions,
        (key) => key,
    ) as {[Prop in keyof InputsGeneric['subCommandDescriptions']]: Prop};

    return {
        ...inputs,
        allAvailableSubCommands,
        subCommands,
        executor,
    };
}
