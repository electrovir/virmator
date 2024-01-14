import {MaybePromise, isTruthy, randomString} from '@augment-vir/common';
import {interpolationSafeWindowsPath} from '@augment-vir/node-js';
import {unlink} from 'fs/promises';
import {dirname, join, resolve} from 'path';
import type {UserConfig} from 'vite';
import {defineCommand} from '../api/command/define-command';
import {NpmDepTypeEnum} from '../api/command/define-command-inputs';
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
            {name: '@augment-vir/node-js', type: NpmDepTypeEnum.Dev},
            {name: 'esbuild', type: NpmDepTypeEnum.Dev},
            {name: 'typescript', type: NpmDepTypeEnum.Dev},
            {name: 'vite-tsconfig-paths', type: NpmDepTypeEnum.Dev},
            {name: 'vite', type: NpmDepTypeEnum.Dev},
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
            `generated-config-${Date.now()}-${randomString()}.cjs`,
        );

        const oldWrite = process.stdout.write;
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
                target: ['node20'],
                platform: 'node',
                bundle: false,
                format: 'cjs',
            });

            /**
             * Disable console logs the first time we require this, as logs will also print when
             * Vite loads the config again.
             */
            process.stdout.write = () => false;
            const viteConfig = await (require(tempFilePath).default as MaybePromise<UserConfig>);
            process.stdout.write = oldWrite;

            const root = viteConfig.root ? resolve(process.cwd(), viteConfig.root) : process.cwd();

            const buildOutputPath = resolve(root, viteConfig?.build?.outDir || 'dist');

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
                      `node -e "require('fs').copyFileSync('${interpolationSafeWindowsPath(
                          indexPath,
                      )}', '${interpolationSafeWindowsPath(dist404Path)}')"`,
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
            process.stdout.write = oldWrite;
            await unlink(tempFilePath);
        }
    },
);
