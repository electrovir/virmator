import {readPackageJson} from '@augment-vir/node-js';
import {join} from 'path';
import {defineCommand} from '../api/command/define-command';
import {NpmDepTypeEnum} from '../api/command/define-command-inputs';
import {withTypescriptConfigFile} from '../augments/typescript-config-file';
import {virmatorConfigsDir} from './../file-paths/package-paths';

export const upgradeDepsCommandDefinition = defineCommand(
    {
        commandName: 'upgrade-deps',
        subCommandDescriptions: {},
        configFiles: {
            ncuConfig: {
                copyFromInternalPath: join(virmatorConfigsDir, 'configs', 'ncu.config.ts'),
                copyToPathRelativeToRepoDir: join('configs', 'ncu.config.ts'),
            },
        },
        npmDeps: [
            {name: 'esbuild', type: NpmDepTypeEnum.Dev},
            {name: 'npm-check-updates', type: NpmDepTypeEnum.Dev},
        ],
    } as const,
    ({commandName, packageBinName}) => {
        return {
            sections: [
                {
                    title: '',
                    content: `Upgrade all packages using npm-check-updates and config/ncu.config.ts.`,
                },
            ],

            examples: [
                {
                    title: 'Run command',
                    content: `${packageBinName} ${commandName}`,
                },
            ],
        };
    },
    async ({repoDir, configFiles}) => {
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
    },
);
