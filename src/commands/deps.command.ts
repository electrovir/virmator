import {isLengthAtLeast, isTruthy} from '@augment-vir/common';
import {ColorKey, readDirRecursive, readPackageJson, toLogString} from '@augment-vir/node-js';
import {existsSync} from 'fs';
import {unlink} from 'fs/promises';
import {getNpmPackages} from 'mono-vir';
import {join} from 'path';
import {defineCommand} from '../api/command/define-command';
import {NpmDepTypeEnum} from '../api/command/define-command-inputs';
import {removeDirectory} from '../augments/fs';
import {compileTs, withTypescriptConfigFile} from '../augments/typescript-config-file';
import {getNpmBinPath, virmatorConfigsDir} from '../file-paths/package-paths';

export const depsCommandDefinition = defineCommand(
    {
        commandName: 'deps',
        subCommandDescriptions: {
            check: 'validate dependencies',
            upgrade: 'upgrade npm dependencies',
            regen: 'regenerate npm dependencies',
        },
        configFiles: {
            depCruiserConfig: {
                copyFromInternalPath: join(virmatorConfigsDir, 'configs', 'dep-cruiser.config.ts'),
                copyToPathRelativeToRepoDir: join('configs', 'dep-cruiser.config.ts'),
            },
            ncuConfig: {
                copyFromInternalPath: join(virmatorConfigsDir, 'configs', 'ncu.config.ts'),
                copyToPathRelativeToRepoDir: join('configs', 'ncu.config.ts'),
            },
        },
        npmDeps: [
            {name: 'esbuild', type: NpmDepTypeEnum.Dev},
            {name: 'npm-check-updates', type: NpmDepTypeEnum.Dev},
            {name: 'dependency-cruiser', type: NpmDepTypeEnum.Dev},
        ],
    } as const,
    ({commandName, packageBinName, configFiles, subCommands}) => {
        return {
            sections: [
                {
                    title: '',
                    content: 'Either upgrade or check dependencies',
                },
                {
                    title: 'check',
                    content: `Check that dependencies are all good via a default set of rules in ${configFiles.depCruiserConfig.copyToPathRelativeToRepoDir} and dependency-cruiser.`,
                },
                {
                    title: 'upgrade',
                    content: `Upgrade all packages using npm-check-updates and ${configFiles.ncuConfig.copyToPathRelativeToRepoDir}.`,
                },
                {
                    title: 'regen',
                    content: 'Regenerate all npm deps and package-lock.json',
                },
            ],

            examples: [
                {
                    title: 'Upgrade deps',
                    content: `${packageBinName} ${commandName} ${subCommands.upgrade}`,
                },
                {
                    title: 'Check deps',
                    content: `${packageBinName} ${commandName} ${subCommands.check}`,
                },
                {
                    title: 'Check deps for a specific file',
                    content: `${packageBinName} ${commandName} ${subCommands.check} ./src/my-file.ts`,
                },
                {
                    title: 'Regen deps',
                    content: `${packageBinName} ${commandName} ${subCommands.regen}`,
                },
            ],
        };
    },
    async ({
        inputSubCommands,
        subCommands,
        allAvailableSubCommands,
        commandName,
        repoDir,
        packageDir,
        configFiles,
        filteredInputArgs,
        logging,
    }) => {
        const subCommandsErrorString = allAvailableSubCommands.join(',');

        if (!isLengthAtLeast(inputSubCommands, 1)) {
            throw new Error(
                `Missing sub command for '${commandName}' command: expected one of ${subCommandsErrorString}`,
            );
        } else if (inputSubCommands.length > 1) {
            throw new Error(
                `Too many sub commands given to '${commandName}' command, only one is allowed from: ${subCommandsErrorString}`,
            );
        } else if (inputSubCommands[0] === subCommands.check) {
            const depCruiserConfigPath = join(
                repoDir,
                configFiles.depCruiserConfig.copyToPathRelativeToRepoDir,
            );
            const compiledConfigPath = await compileTs({inputPath: depCruiserConfigPath});

            const depCruiseCommand = await getNpmBinPath({
                repoDir: repoDir,
                command: 'depcruise',
                packageDirPath: packageDir,
            });

            const npmWorkspaces = await getNpmPackages(repoDir);

            const nonFlagInputs = filteredInputArgs.filter((arg) => !arg.startsWith('-'));

            const serial = filteredInputArgs.some((arg) => arg === '--serial');

            const pathsToCheck: string[] = nonFlagInputs.length ? nonFlagInputs : ['src'];

            const monoVirCommands =
                npmWorkspaces.length && !nonFlagInputs.length
                    ? [
                          'mono-vir',
                          serial ? 'for-each' : 'for-each-async',
                      ]
                    : [];

            return {
                args: [
                    ...monoVirCommands,
                    depCruiseCommand,
                    '--config',
                    compiledConfigPath,
                    ...pathsToCheck,
                ].filter(isTruthy),
                async postExecute() {
                    await unlink(compiledConfigPath);
                },
            };
        } else if (inputSubCommands[0] === subCommands.upgrade) {
            const ncuConfigPath = join(repoDir, configFiles.ncuConfig.copyToPathRelativeToRepoDir);
            return await withTypescriptConfigFile(ncuConfigPath, async (loadedConfig) => {
                const repoPackageJson = await readPackageJson(repoDir);

                const config = loadedConfig.ncuConfig;

                await (
                    await import('npm-check-updates')
                ).run(
                    {
                        ...config,
                        cwd: repoDir,
                        json: false,
                        workspaces: !!repoPackageJson.workspaces,
                        format: [],
                    },
                    {
                        cli: true,
                    },
                );

                return {success: true};
            });
        } else if (inputSubCommands[0] === subCommands.regen) {
            const allChildNodeModules = await readDirRecursive(repoDir);
            const nodeModulesPaths = Array.from(
                new Set(
                    allChildNodeModules
                        .filter((path) => path.includes('node_modules'))
                        .map((path) =>
                            path.replace(/([\\\/]|^)node_modules[\\\/].+$/, '$1node_modules'),
                        ),
                ),
            );

            const packageLockPath = join(repoDir, 'package-lock.json');

            const removePackageLock = existsSync(packageLockPath);

            const logLines = [
                'Removing node_modules:',
                ...nodeModulesPaths.map((nodeModulesPath) => `    ${nodeModulesPath}`),
                removePackageLock ? '\nRemoving package-lock.json' : '',
            ].filter(isTruthy);

            logging.stdout(
                toLogString({
                    args: [
                        logLines.join('\n'),
                    ],
                    colors: ColorKey.faint,
                }),
            );

            let errorsHappened = false;

            if (removePackageLock) {
                try {
                    await unlink(packageLockPath);
                } catch (error) {
                    errorsHappened = true;
                    logging.stderr('Failed to remove package-lock.json.');
                }
            }

            await Promise.all(
                nodeModulesPaths.map(async (nodeModulesPath) => {
                    try {
                        await removeDirectory(nodeModulesPath);
                    } catch (error) {
                        errorsHappened = true;
                        logging.stderr('Failed to remove package-lock.json.');
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
        } else {
            throw new Error(
                `Invalid sub command for '${commandName}' given: got '${inputSubCommands[0]}' but expected one of ${subCommandsErrorString}`,
            );
        }
    },
);
