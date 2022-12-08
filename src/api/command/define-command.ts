import {getObjectTypedKeys, mapObjectValues} from '@augment-vir/common';
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
    extend: (inputs: {
        defineCommandInputs: Readonly<DefineCommandInputsGeneric>;
        createDescription: CreateDescriptionsCallback<DefineCommandInputsGeneric>;
        inputExecutor: CommandExecutorDefinition<DefineCommandInputsGeneric>;
    }) => CommandDefinition<DefineCommandInputsGeneric>;
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

    function extend(
        inputs: Partial<{
            defineCommandInputs: Readonly<DefineCommandInputsGeneric>;
            createDescription: CreateDescriptionsCallback<DefineCommandInputsGeneric>;
            inputExecutor: CommandExecutorDefinition<DefineCommandInputsGeneric>;
        }>,
    ) {
        return defineCommand(
            {
                ...defineCommandInputs,
                ...inputs.defineCommandInputs,
            },
            (callbackInputs) => {
                return {
                    ...createDescription(callbackInputs),
                    ...inputs.createDescription?.(callbackInputs),
                };
            },
            (callbackInputs) => {
                return {
                    ...inputExecutor(callbackInputs),
                    ...inputs.inputExecutor?.(callbackInputs),
                };
            },
        );
    }

    return {
        ...init,
        executor,
        createDescription,
        extend,
    };
}
