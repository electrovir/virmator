import {isTruthy} from '@augment-vir/common';
import {ColorKey, readDirRecursive, toLogString} from '@augment-vir/node-js';
import {existsSync} from 'fs';
import {unlink} from 'fs/promises';
import {join} from 'path';
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
        const nodeModulesPaths = Array.from(
            new Set(
                allChildNodeModules
                    .filter((path) => path.includes('node_modules'))
                    .map((path) =>
                        path.replace(/([\\\/]|^)node_modules[\\\/].+$/, '$1node_modules'),
                    ),
            ),
        );

        const packageLockPath = join(inputs.repoDir, 'package-lock.json');

        const removePackageLock = existsSync(packageLockPath);

        inputs.logging.stdout(
            toLogString({
                args: [
                    'Removing node_modules:',
                    ...nodeModulesPaths.map((nodeModulesPath) => `    ${nodeModulesPath}`),
                    removePackageLock ? 'Removing package-lock.json' : '',
                ].filter(isTruthy),
                colors: ColorKey.faint,
            }),
        );

        let errorsHappened = false;

        if (removePackageLock) {
            try {
                await unlink(packageLockPath);
            } catch (error) {
                errorsHappened = true;
                inputs.logging.stderr('Failed to remove package-lock.json.');
            }
        }

        await Promise.all(
            nodeModulesPaths.map(async (nodeModulesPath) => {
                try {
                    await removeDirectory(nodeModulesPath);
                } catch (error) {
                    errorsHappened = true;
                    inputs.logging.stderr('Failed to remove package-lock.json.');
                }
            }),
        );

        if (errorsHappened) {
            return {
                success: false,
            };
        }

        return {
            args: [
                'npm',
                'i',
            ],
        };
    },
);
