import {getObjectTypedKeys, mapObjectValues} from '@augment-vir/common';
import {IsAny} from 'type-fest/source/internal';
import {CreateDescriptionsCallback} from './command-description';
import {CommandExecutor, CommandExecutorDefinition} from './command-executor';
import {
    DefineCommandInputs,
    SharedExecutorInputsAndCommandDefinition,
    SubCommandsMap,
} from './define-command-inputs';

export type ExtendCallback<
    DefineCommandInputsGeneric extends DefineCommandInputs = DefineCommandInputs<any>,
> = (inputs: {
    defineCommandInputs: Readonly<DefineCommandInputsGeneric>;
    createDescription: CreateDescriptionsCallback<DefineCommandInputsGeneric>;
    inputExecutor: CommandExecutorDefinition<DefineCommandInputsGeneric>;
}) => CommandDefinition<DefineCommandInputsGeneric>;

export type CommandDefinition<DefineCommandInputsGeneric extends DefineCommandInputs = any> =
    IsAny<DefineCommandInputsGeneric> extends true
        ? AnyCommandDefinition
        : SharedExecutorInputsAndCommandDefinition<DefineCommandInputsGeneric> & {
              executor: CommandExecutor<DefineCommandInputsGeneric>;
              createDescription: CreateDescriptionsCallback<DefineCommandInputsGeneric>;
              extend: ExtendCallback<DefineCommandInputsGeneric>;
          };

export type AnyCommandDefinition = DefineCommandInputs & {
    allAvailableSubCommands: ReadonlyArray<string>;
    subCommands: Record<string, string>;
    executor: CommandExecutor<any>;
    createDescription: CreateDescriptionsCallback<any>;
    extend: ExtendCallback<any>;
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
    } as SharedExecutorInputsAndCommandDefinition<DefineCommandInputsGeneric>;

    const executor: CommandExecutor<DefineCommandInputsGeneric> = async (executorInputs) => {
        return await inputExecutor({
            ...executorInputs,
            ...init,
        });
    };

    function extend(
        inputs: Partial<{
            defineCommandInputs: Partial<Readonly<DefineCommandInputsGeneric>>;
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
            async (callbackInputs) => {
                return {
                    ...(await inputExecutor(callbackInputs)),
                    ...(await inputs.inputExecutor?.(callbackInputs)),
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
