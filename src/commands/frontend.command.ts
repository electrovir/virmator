import {join} from 'path';
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
        const needToBuild = !!inputs.inputSubCommands.length;
        const useDefaultConfigArgs = !inputs.filteredInputArgs.includes('--config');
        const configString = useDefaultConfigArgs
            ? `--config ${getCopyToPath({
                  repoDir: inputs.repoDir,
                  configFileDefinition: inputs.configFiles.vite,
                  packageDir: virmatorPackageDir,
              })}`
            : '';

        const viteBinPath = await getNpmBinPath({
            repoDir: inputs.repoDir,
            command: 'vite',
            packageDirPath: inputs.packageDir,
        });
        const removeOutput = needToBuild ? 'rm -rf dist && ' : '';
        const mainCommand = `${removeOutput}${viteBinPath}`;

        const subCommandArgs = needToBuild
            ? [
                  'build',
                  ...inputs.filteredInputArgs,
                  '&&',
                  'cp dist/index.html dist/404.html',
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
