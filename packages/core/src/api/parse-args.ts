import {check} from '@augment-vir/assert';
import {
    getObjectTypedEntries,
    mapObjectValues,
    wrapInTry,
    type Logger,
    type Writable,
} from '@augment-vir/common';
import {extractRelevantArgs} from '@augment-vir/node';
import {accessAtKeys} from '../augments/object/access.js';
import {type UsedVirmatorPluginCommands} from '../plugin/plugin-executor.js';
import {
    type IndividualPluginCommand,
    type VirmatorPluginCliCommands,
} from '../plugin/plugin-init.js';
import {type VirmatorPlugin} from '../plugin/plugin.js';
import {virmatorFlags, type SetVirmatorFlags} from './virmator-flags.js';

/**
 * All supported sets of args for virmator.
 *
 * @category Util
 */
export type ParsedArgs = {
    virmatorFlags: SetVirmatorFlags;
    commands: [
        string,
        ...string[],
    ];
    filteredCommandArgs: string[];
    plugin: Readonly<VirmatorPlugin> | undefined;
    usedCommands: UsedVirmatorPluginCommands;
};

/**
 * Arbitrarily nested arbitrary virmator plugin commands.
 *
 * @category Util
 */
export type NestedSubCommands = Readonly<{[SubCommand in string]: NestedSubCommands}>;

/**
 * A mapping from command strings to plugins.
 *
 * @category Util
 */
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

/**
 * Map a set of plugins from their top level commands to the plugins themselves.
 *
 * @category Util
 */
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
                if (!check.isString(commandName)) {
                    throw new TypeError(
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
                    subCommands: extractNestedCommands(
                        (command as IndividualPluginCommand).subCommands || {},
                    ),
                };
            },
        );
    });

    return mappedPlugins;
}

/**
 * Determine the path of used commands from a plugin's nested cli command definition.
 *
 * @category Util
 */
export function calculateUsedCommands(
    pluginCliCommands: Readonly<VirmatorPluginCliCommands>,
    commands: ReadonlyArray<string>,
): UsedVirmatorPluginCommands {
    if (!check.isLengthAtLeast(commands, 1)) {
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

/**
 * Parses a raw cli command into supported virmator args.
 *
 * @category Util
 */
export function parseCliArgs({
    cliCommand,
    entryPointFilePath,
    plugins,
    log,
}: {
    plugins: ReadonlyArray<Readonly<VirmatorPlugin>>;
    cliCommand: string | ReadonlyArray<string>;
    entryPointFilePath: string;
    log: Logger;
}): ParsedArgs {
    const rawArgs: ReadonlyArray<string> = check.isArray(cliCommand)
        ? cliCommand
        : cliCommand.split(' ');

    const relevantArgs: ReadonlyArray<string> = wrapInTry(
        () => {
            return extractRelevantArgs({
                binName: 'virmator',
                rawArgs,
                fileName: entryPointFilePath,
                errorIfNotFound: true,
            });
        },
        {
            fallbackValue: rawArgs,
        },
    );

    const mappedPlugins = mapPluginsByCommand(plugins);

    const parsedArgs = relevantArgs.reduce(
        (parsedArgs: ParsedArgs, arg) => {
            if (check.isKeyOf(arg, virmatorFlags)) {
                parsedArgs.virmatorFlags[arg] = true;
            } else if (parsedArgs.filteredCommandArgs.length) {
                parsedArgs.filteredCommandArgs.push(arg);
            } else if (check.isLengthAtLeast(parsedArgs.commands, 1)) {
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
            usedCommands: {},
        },
    );

    if (parsedArgs.virmatorFlags['--help']) {
        parsedArgs.commands = ['help'];
        parsedArgs.filteredCommandArgs = [];
        parsedArgs.plugin = mappedPlugins['help']?.plugin;
    }

    parsedArgs.usedCommands = calculateUsedCommands(
        parsedArgs.plugin?.cliCommands || {},
        parsedArgs.commands,
    );

    return parsedArgs;
}
