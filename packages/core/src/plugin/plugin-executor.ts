import type {MaybePromise} from '@augment-vir/common';
import type {Logger, runShellCommand} from '@augment-vir/node-js';
import {
    IndividualPluginCommand,
    VirmatorPluginCliCommands,
    VirmatorPluginInit,
} from './plugin-init';

export type UsedVirmatorPluginCommands<
    Commands extends VirmatorPluginCliCommands = VirmatorPluginCliCommands,
> = Partial<
    Readonly<{
        [CliCommand in keyof Commands]: Readonly<
            Omit<IndividualPluginCommand, 'subCommands'> & {
                subCommands: Commands[CliCommand] extends {
                    subCommands: infer SubCommands extends NonNullable<VirmatorPluginCliCommands>;
                }
                    ? UsedVirmatorPluginCommands<SubCommands>
                    : never;
            }
        >;
    }>
>;

export type VirmatorPluginExecutorParams<
    Commands extends VirmatorPluginCliCommands = VirmatorPluginCliCommands,
> = Readonly<{
    cliInputs: Readonly<{
        filteredArgs: string[];
        usedCommands: UsedVirmatorPluginCommands<Commands>;
    }>;
    cwd: string;

    /** Run a shell command with sensible defaults. */
    runShellCommand: typeof runShellCommand;

    log: Logger;

    virmator: Readonly<{
        /** All plugins currently installed on the currently executing virmator instance. */
        allPlugins: ReadonlyArray<VirmatorPluginInit>;
        /** Path of the current plugin's installation. This will likely be within `node_modules`. */
        pluginPackageRootPath: string;
    }>;
}>;

export type VirmatorPluginExecutor<
    Commands extends VirmatorPluginCliCommands = VirmatorPluginCliCommands,
> = (params: VirmatorPluginExecutorParams<Commands>) => MaybePromise<void>;
