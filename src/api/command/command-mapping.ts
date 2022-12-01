import {ArrayElement} from '@augment-vir/common';
import {CommandDefinition} from './define-command';

export type CommandMapping = Record<string, CommandDefinition>;

export function commandsToMapping(
    commands: ReadonlyArray<CommandDefinition>,
): Readonly<CommandMapping> {
    return commands.reduce((mapping, currentCommandDefinition) => {
        mapping[currentCommandDefinition.commandName] = currentCommandDefinition;
        return mapping;
    }, {} as CommandMapping);
}

export type CommandDefinitionArrayToMapping<
    DefinitionArray extends ReadonlyArray<CommandDefinition>,
> = {[CommandName in ArrayElement<DefinitionArray>['commandName']]: CommandDefinition};
