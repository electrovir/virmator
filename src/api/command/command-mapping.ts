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
