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
                required: true,
            },
        },
        npmDeps: [
            'vite',
            'ansi-colors',
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
    (inputs) => {
        const needToBuild = !!inputs.inputSubCommands.length;
        const useDefaultConfigArgs = !inputs.filteredInputArgs.includes('--config');
        const configString = useDefaultConfigArgs
            ? `--config ${getCopyToPath({
                  repoDir: inputs.repoDir,
                  configFileDefinition: inputs.configFiles.vite,
                  packageDir: virmatorPackageDir,
              })}`
            : '';

        const viteBinPath = getNpmBinPath('vite');
        const removeOutput = needToBuild ? 'rm -rf dist' : '';
        const mainCommand = `${removeOutput}${viteBinPath}`;

        const subCommandArgs = needToBuild
            ? [
                  '--colors',
                  'build',
                  configString,
                  ...inputs.filteredInputArgs,
                  '&&',
                  'cp dist/index.html dist/404.html',
              ]
            : [];

        const hostString = inputs.filteredInputArgs.includes('--host') ? '' : `--host`;
        const previewCommandArgs = inputs.inputSubCommands.includes('preview')
            ? [
                  '&&',
                  viteBinPath,
                  'preview',
                  configString,
                  ...inputs.filteredInputArgs,
                  hostString,
              ]
            : [];

        return {
            mainCommand,
            args: [
                '--force',
                configString,
                ...subCommandArgs,
                ...previewCommandArgs,
            ],
        };
    },
);