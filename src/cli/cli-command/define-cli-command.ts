import {getObjectTypedKeys} from 'augment-vir';
import {DefineCliCommandInputs} from './cli-define-cli-command-input';
import {CliCommandExecutor} from './cli-executor';

export type CliCommandDefinition<
    InputsGeneric extends DefineCliCommandInputs = DefineCliCommandInputs,
> = InputsGeneric & {
    availableSubCommands: (keyof InputsGeneric['subCommandDescriptions'])[];
    executor: CliCommandExecutor<InputsGeneric>;
};

export function defineCliCommand<InputsGeneric extends DefineCliCommandInputs>(
    inputs: Readonly<InputsGeneric>,
    executor: CliCommandExecutor<InputsGeneric>,
): CliCommandDefinition<InputsGeneric> {
    const availableSubCommands: (keyof InputsGeneric['subCommandDescriptions'])[] =
        getObjectTypedKeys(inputs.subCommandDescriptions);

    return {
        ...inputs,
        availableSubCommands,
        executor,
    };
}
