import {getObjectTypedKeys, mapObjectValues} from 'augment-vir';
import {CreateDescriptionsCallback} from './command-description';
import {CommandExecutor, CommandExecutorDefinition} from './command-executor';
import {
    DefineCommandInputs,
    SharedExecutorInputsAndCommandDefinition,
    SubCommandsMap,
} from './define-command-inputs';

export type CommandDefinition<
    DefineCommandInputsGeneric extends DefineCommandInputs = DefineCommandInputs<string>,
> = SharedExecutorInputsAndCommandDefinition<DefineCommandInputsGeneric> & {
    executor: CommandExecutor<DefineCommandInputsGeneric>;
    createDescription: CreateDescriptionsCallback<DefineCommandInputsGeneric>;
};

export function defineCommand<DefineCommandInputsGeneric extends DefineCommandInputs>(
    defineCommandInputs: Readonly<DefineCommandInputsGeneric>,
    createDescription: CreateDescriptionsCallback<DefineCommandInputsGeneric>,
    inputExecutor: CommandExecutorDefinition<DefineCommandInputsGeneric>,
): CommandDefinition<DefineCommandInputsGeneric> {
    const allAvailableSubCommands: ReadonlyArray<
        keyof DefineCommandInputsGeneric['subCommandDescriptions']
    > = getObjectTypedKeys(defineCommandInputs.subCommandDescriptions);
    const subCommands: SubCommandsMap<DefineCommandInputsGeneric> = mapObjectValues(
        defineCommandInputs.subCommandDescriptions,
        (key) => key,
    ) as SubCommandsMap<DefineCommandInputsGeneric>;

    const init: SharedExecutorInputsAndCommandDefinition<DefineCommandInputsGeneric> = {
        ...defineCommandInputs,
        allAvailableSubCommands,
        subCommands,
    };

    const executor: CommandExecutor<DefineCommandInputsGeneric> = (executorInputs) => {
        return inputExecutor({
            ...executorInputs,
            ...init,
        });
    };

    return {
        ...init,
        executor,
        createDescription,
    };
}
