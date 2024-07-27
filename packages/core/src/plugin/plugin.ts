import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {searchUpwardsForDir} from '../augments/fs/search';
import {VirmatorPluginExecutor} from './plugin-executor';
import {VirmatorPluginCliCommands, VirmatorPluginInit} from './plugin-init';

export type VirmatorPlugin<Commands extends VirmatorPluginCliCommands = any> = Readonly<
    VirmatorPluginInit<NoInfer<Commands>> & {
        pluginPackageRootPath: string;
        executor: VirmatorPluginExecutor<NoInfer<Commands>>;
    }
>;

export function defineVirmatorPlugin<const Commands extends VirmatorPluginCliCommands>(
    /** Should be `import.meta.dirname`. Used to determine the directory of the plugin's package. */
    currentDir: string,
    init: VirmatorPluginInit<Commands>,
    executor: VirmatorPluginExecutor<NoInfer<Commands>>,
): VirmatorPlugin<NoInfer<Commands>> {
    const pluginPackageRootPath = searchUpwardsForDir(currentDir, (path) => {
        return existsSync(join(path, 'package.json'));
    });

    return {
        ...init,
        executor,
        pluginPackageRootPath,
    };
}
