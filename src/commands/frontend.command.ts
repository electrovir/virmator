import {isTruthy} from '@augment-vir/common';
import {join} from 'path';
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

        const needToBuild = !!inputs.inputSubCommands.length;
        const useDefaultConfigArgs = !inputs.filteredInputArgs.includes('--config');
        const configString = useDefaultConfigArgs ? `--config ${viteConfigPath}` : '';

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

        const subCommandArgs = needToBuild
            ? [
                  'build',
                  ...inputs.filteredInputArgs,
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
    },
);
