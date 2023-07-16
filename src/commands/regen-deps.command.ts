import {readDirRecursive} from '@augment-vir/node-js';
import {defineCommand} from '../api/command/define-command';
import {removeDirectory} from '../augments/fs';

export const regenDepsCommandDefinition = defineCommand(
    {
        commandName: 'regen-deps',
        subCommandDescriptions: {},
        configFiles: {},
        npmDeps: [],
    } as const,
    () => {
        return {
            sections: [
                {
                    title: '',
                    content: `Regenerates all npm deps.`,
                },
            ],
            examples: [],
        };
    },
    async (inputs) => {
        const allChildNodeModules = await readDirRecursive(inputs.repoDir);
        const nodeModulesPaths = new Set(
            allChildNodeModules
                .filter((path) => path.includes('node_modules'))
                .map((path) => path.replace(/[\\\/]node_modules[\\\/].+$/, '')),
        );

        await Promise.all(
            Array.from(nodeModulesPaths).map(async (nodeModulesPath) => {
                await removeDirectory(nodeModulesPath);
            }),
        );

        return {
            args: [
                'npm',
                'i',
            ],
        };
    },
);
