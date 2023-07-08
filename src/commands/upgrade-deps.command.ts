import {extractErrorMessage} from '@augment-vir/common';
import {randomString, readPackageJson} from '@augment-vir/node-js';
import {unlink} from 'fs/promises';
import {join} from 'path';
import {defineCommand} from '../api/command/define-command';
import {NpmDepTypeEnum} from '../api/command/define-command-inputs';
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
    async (inputs) => {
        const tempFilePath = join(__dirname, `config-output-${Date.now()}-${randomString()}.cjs`);
        try {
            const configPath = join(
                inputs.repoDir,
                inputs.configFiles.ncuConfig.copyToPathRelativeToRepoDir,
            );
            await (
                await import('esbuild')
            ).build({
                entryPoints: [configPath],
                outfile: tempFilePath,
                write: true,
                target: ['node18'],
                platform: 'node',
                bundle: false,
                format: 'cjs',
            });

            const repoPackageJson = await readPackageJson(inputs.repoDir);

            const loadedConfig = require(tempFilePath);

            const config = loadedConfig.ncuConfig;

            await (
                await import('npm-check-updates')
            ).run(
                {
                    ...config,
                    cwd: inputs.repoDir,
                    json: false,
                    workspaces: !!repoPackageJson.workspaces,
                    format: [],
                },
                {
                    cli: true,
                },
            );

            return {success: true};
        } catch (error) {
            console.error(extractErrorMessage(error));
            return {success: false};
        } finally {
            try {
                await unlink(tempFilePath);
            } catch (error) {}
        }
    },
);
