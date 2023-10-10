import {isLengthAtLeast} from '@augment-vir/common';
import {readPackageJson} from '@augment-vir/node-js';
import {unlink} from 'fs/promises';
import {join} from 'path';
import {defineCommand} from '../api/command/define-command';
import {NpmDepTypeEnum} from '../api/command/define-command-inputs';
import {compileTs, withTypescriptConfigFile} from '../augments/typescript-config-file';
import {getNpmBinPath, virmatorConfigsDir} from '../file-paths/package-paths';

export const depsCommandDefinition = defineCommand(
    {
        commandName: 'deps',
        subCommandDescriptions: {
            check: 'validate dependencies',
            upgrade: 'upgrade npm dependencies',
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
            const pathsToCheck: string[] = filteredInputArgs.length
                ? filteredInputArgs
                : [join(repoDir, 'src')];

            const depCruiseCommand = await getNpmBinPath({
                repoDir: repoDir,
                command: 'depcruise',
                packageDirPath: packageDir,
            });

            return {
                args: [
                    depCruiseCommand,
                    '--config',
                    compiledConfigPath,
                    ...pathsToCheck,
                ],
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
        } else {
            throw new Error(
                `Invalid sub command for '${commandName}' given: got '${inputSubCommands[0]}' but expected one of ${subCommandsErrorString}`,
            );
        }
    },
);
