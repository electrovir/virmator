import {
    getObjectTypedEntries,
    hasKey,
    isLengthAtLeast,
    mapObjectValues,
    wrapInTry,
} from '@augment-vir/common';
import {extractRelevantArgs} from 'cli-args-vir';
import {isRunTimeType} from 'run-time-assertions';
import {Writable} from 'type-fest';
import {accessAtKeys} from '../augments/object/access';
import {VirmatorPlugin} from '../plugin/plugin';
import {UsedVirmatorPluginCommands} from '../plugin/plugin-executor';
import {VirmatorPluginCliCommands} from '../plugin/plugin-init';
import {PluginLogger} from '../plugin/plugin-logger';
import {SetVirmatorFlags, virmatorFlags} from './virmator-flags';

/** All supported sets of args for virmator. */
export type ParsedArgs = {
    virmatorFlags: SetVirmatorFlags;
    commands: [string, ...string[]];
    filteredCommandArgs: string[];
    plugin: Readonly<VirmatorPlugin> | undefined;
    topLevelCommands: ReadonlyArray<string>;
    usedCommands: UsedVirmatorPluginCommands;
};

/** Arbitrarily nested arbitrary virmator plugin commands. */
export type NestedSubCommands = Readonly<{[SubCommand in string]: NestedSubCommands}>;

/** A mapping from command strings to plugins. */
export type PluginsMappedByCommand = Readonly<{
    [Command in string]: Readonly<{
        plugin: Readonly<VirmatorPlugin>;
        subCommands: NestedSubCommands;
    }>;
}>;

function extractNestedCommands(
    cliCommands: Readonly<VirmatorPluginCliCommands>,
): NestedSubCommands {
    return mapObjectValues(cliCommands, (commandName, command) => {
        if (command.subCommands) {
            return extractNestedCommands(command.subCommands);
        } else {
            return {};
        }
    });
}

/** Map a set of plugins from their top level commands to the plugins themselves. */
export function mapPluginsByCommand(
    plugins: ReadonlyArray<Readonly<VirmatorPlugin>>,
): PluginsMappedByCommand {
    const mappedPlugins: Writable<PluginsMappedByCommand> = {};

    plugins.forEach((plugin) => {
        getObjectTypedEntries(plugin.cliCommands).forEach(
            ([
                commandName,
                command,
            ]) => {
                if (!isRunTimeType(commandName, 'string')) {
                    throw new Error(
                        `Command '${String(commandName)}' in plugin '${plugin.name}' must be string.`,
                    );
                }

                const existingPlugin = mappedPlugins[commandName]?.plugin;

                if (existingPlugin) {
                    throw new Error(
                        `Duplicate virmator command: '${commandName}' found in plugin '${plugin.name}' and plugin '${existingPlugin.name}'`,
                    );
                }

                mappedPlugins[commandName] = {
                    plugin,
                    subCommands: extractNestedCommands(command.subCommands || {}),
                };
            },
        );
    });

    return mappedPlugins;
}

/** Determine the path of used commands from a plugin's nested cli command definition. */
export function calculateUsedCommands(
    pluginCliCommands: Readonly<VirmatorPluginCliCommands>,
    commands: ReadonlyArray<string>,
): UsedVirmatorPluginCommands {
    if (!isLengthAtLeast(commands, 1)) {
        return {};
    }

    const pluginCommand = pluginCliCommands[commands[0]];

    if (!pluginCommand) {
        return {};
    }

    const subCommands = calculateUsedCommands(pluginCommand.subCommands || {}, commands.slice(1));

    const usedCommands: UsedVirmatorPluginCommands = {
        [commands[0]]: {
            ...pluginCommand,
            subCommands: Object.keys(subCommands).length ? subCommands : {},
        },
    };

    return usedCommands;
}

/** Parses a raw cli command into supported virmator args. */
export function parseCliArgs({
    cliCommand,
    entryPointFilePath,
    plugins,
    log,
}: {
    plugins: ReadonlyArray<Readonly<VirmatorPlugin>>;
    cliCommand: string | ReadonlyArray<string>;
    entryPointFilePath: string;
    log: PluginLogger;
}): ParsedArgs {
    const rawArgs: ReadonlyArray<string> = isRunTimeType(cliCommand, 'array')
        ? cliCommand
        : cliCommand.split(' ');

    const relevantArgs: ReadonlyArray<string> = wrapInTry(
        () =>
            extractRelevantArgs({
                binName: 'virmator',
                rawArgs,
                fileName: entryPointFilePath,
                errorIfNotFound: true,
            }),
        {
            fallbackValue: rawArgs,
        },
    );

    const mappedPlugins = mapPluginsByCommand(plugins);

    const parsedArgs = relevantArgs.reduce(
        (parsedArgs: ParsedArgs, arg) => {
            if (parsedArgs.filteredCommandArgs.length) {
                parsedArgs.filteredCommandArgs.push(arg);
            } else if (isLengthAtLeast(parsedArgs.commands, 1)) {
                const mainCommand = parsedArgs.commands[0];
                const subCommands = mappedPlugins[mainCommand]?.subCommands || {};
                const availableSubCommands = accessAtKeys<NestedSubCommands>(
                    subCommands,
                    parsedArgs.commands.slice(1),
                );

                if (availableSubCommands && arg in availableSubCommands) {
                    parsedArgs.commands.push(arg);
                } else {
                    parsedArgs.filteredCommandArgs.push(arg);
                }
            } else {
                const commandPlugin = mappedPlugins[arg];
                if (commandPlugin) {
                    (parsedArgs.commands as string[]).push(arg);
                    parsedArgs.plugin = commandPlugin.plugin;
                } else if (hasKey(virmatorFlags, arg)) {
                    parsedArgs.virmatorFlags[arg] = true;
                } else {
                    log.warning(`Ignored unknown flag: '${arg}'`);
                }
            }

            return parsedArgs;
        },
        {
            virmatorFlags: {},
            commands: [] as string[] as ParsedArgs['commands'],
            filteredCommandArgs: [],
            plugin: undefined,
            topLevelCommands: Object.keys(mappedPlugins),
            usedCommands: {},
        },
    );

    parsedArgs.usedCommands = calculateUsedCommands(
        parsedArgs.plugin?.cliCommands || {},
        parsedArgs.commands,
    );

    return parsedArgs;
}
