import {getObjectTypedKeys, mapObject} from 'augment-vir';
import {CreateDescriptionsCallback} from './command-description';
import {CommandExecutor} from './command-executor';
import {
    DefineCommandInputs,
    SharedExecutorInputsAndCommandDefinition,
    SubCommandsMap,
} from './define-command-inputs';

export type CommandDefinition<
    DefineCommandInputsGeneric extends DefineCommandInputs = DefineCommandInputs,
> = SharedExecutorInputsAndCommandDefinition<DefineCommandInputsGeneric> & {
    executor: CommandExecutor<DefineCommandInputsGeneric>;
    createDescription: CreateDescriptionsCallback<DefineCommandInputsGeneric>;
};

export function defineCommand<DefineCommandInputsGeneric extends DefineCommandInputs>(
    defineCommandInputs: Readonly<DefineCommandInputsGeneric>,
    createDescription: CreateDescriptionsCallback<DefineCommandInputsGeneric>,
    inputExecutor: CommandExecutor<DefineCommandInputsGeneric>,
): CommandDefinition<DefineCommandInputsGeneric> {
    const allAvailableSubCommands: (keyof DefineCommandInputsGeneric['subCommandDescriptions'])[] =
        getObjectTypedKeys(defineCommandInputs.subCommandDescriptions);
    const subCommands: SubCommandsMap<DefineCommandInputsGeneric> = mapObject(
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
