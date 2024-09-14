import {assert} from '@augment-vir/assert';
import {findAncestor} from '@augment-vir/node';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {VirmatorPlugin, VirmatorPluginExecutor} from './plugin-executor.js';
import {VirmatorPluginCliCommands, VirmatorPluginInit} from './plugin-init.js';

export type {VirmatorPlugin} from './plugin-executor.js';

/** Define a virmator plugin. */
export function defineVirmatorPlugin<const Commands extends VirmatorPluginCliCommands>(
    /** Should be `import.meta.dirname`. Used to determine the directory of the plugin's package. */
    currentDir: string,
    init: VirmatorPluginInit<Commands>,
    executor: VirmatorPluginExecutor<NoInfer<Commands>>,
): VirmatorPlugin<NoInfer<Commands>> {
    const pluginPackageRootPath = findAncestor(currentDir, (path) => {
        return existsSync(join(path, 'package.json'));
    });

    assert.isDefined(pluginPackageRootPath, 'Failed to find plugin package root.');

    return {
        ...init,
        executor,
        pluginPackageRootPath,
    };
}
