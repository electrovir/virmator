import {isTruthy} from '@augment-vir/common';
import {randomString} from '@augment-vir/node-js';
import {unlink} from 'fs/promises';
import {dirname, join, resolve} from 'path';
import type {UserConfig} from 'vite';
import {defineCommand} from '../api/command/define-command';
import {getCopyToPath} from '../api/config/config-paths';
import {getNpmBinPath, virmatorConfigsDir, virmatorPackageDir} from '../file-paths/package-paths';

export const frontendCommandDefinition = defineCommand(
    {
        commandName: 'frontend',
        subCommandDescriptions: {
            build: 'Builds and bundles the frontend for deployment.',
            preview: 'Builds and previews the built output.',
        },
        configFiles: {
            vite: {
                copyFromInternalPath: join(virmatorConfigsDir, 'configs', 'vite.config.ts'),
                copyToPathRelativeToRepoDir: join('configs', 'vite.config.ts'),
            },
        },
        npmDeps: [
            'vite',
            '@augment-vir/node-js',
            'vite-tsconfig-paths',
            'esbuild',
        ],
    } as const,
    () => {
        return {
            sections: [
                {
                    title: '',
                    content: `Runs a frontend. Currently uses vite.`,
                },
            ],
            examples: [],
        };
    },
    async (inputs) => {
        const viteConfigPath = getCopyToPath({
            repoDir: inputs.repoDir,
            configFileDefinition: inputs.configFiles.vite,
            packageDir: virmatorPackageDir,
        });
        const tempFilePath = join(
            dirname(viteConfigPath),
            `config-output-${Date.now()}-${randomString()}.cjs`,
        );

        try {
            const needToBuild = !!inputs.inputSubCommands.length;
            const useDefaultConfigArgs = !inputs.filteredInputArgs.includes('--config');
            const configString = useDefaultConfigArgs ? `--config ${viteConfigPath}` : '';

            await (
                await import('esbuild')
            ).build({
                entryPoints: [viteConfigPath],
                outfile: tempFilePath,
                write: true,
                target: ['node18'],
                platform: 'node',
                bundle: false,
                format: 'cjs',
            });

            const viteConfigValues: UserConfig = require(tempFilePath).default;

            const root = viteConfigValues.root
                ? resolve(process.cwd(), viteConfigValues.root)
                : process.cwd();

            const buildOutputPath = resolve(root, viteConfigValues?.build?.outDir || 'dist');

            const viteBinPath = await getNpmBinPath({
                repoDir: inputs.repoDir,
                command: 'vite',
                packageDirPath: inputs.packageDir,
            });
            const removeCommand = needToBuild
                ? `node -e "require('fs').rmSync('node_modules/.vite', {recursive: true, force: true})"`
                : '';

            const mainCommand = [
                removeCommand,
                viteBinPath,
            ]
                .filter(isTruthy)
                .join(' && ');

            const indexPath = join(buildOutputPath, 'index.html');
            const dist404Path = join(buildOutputPath, '404.html');

            const subCommandArgs = needToBuild
                ? [
                      'build',
                      ...inputs.filteredInputArgs,
                      '&&',
                      `node -e "require('fs').copyFileSync('${indexPath}', '${dist404Path}')"`,
                  ]
                : inputs.filteredInputArgs;

            const previewCommandArgs = inputs.inputSubCommands.includes(inputs.subCommands.preview)
                ? [
                      '&&',
                      viteBinPath,
                      'preview',
                      ...inputs.filteredInputArgs,
                  ]
                : [];

            return {
                args: [
                    mainCommand,
                    '--force',
                    configString,
                    ...subCommandArgs,
                    ...previewCommandArgs,
                ],
            };
        } finally {
            await unlink(tempFilePath);
        }
    },
);
