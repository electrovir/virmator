import {defineCommand} from '../api/command/define-command';
import {getNpmBinPath} from '../file-paths/virmator-package-paths';

export const frontendCommandDefinition = defineCommand(
    {
        commandName: 'frontend',
        subCommandDescriptions: {
            build: 'Builds and bundles the frontend for deployment.',
            preview: 'Builds and previews the built output.',
        },
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
            ? `--config ${getCopyToPath(configFiles.vite, inputs.repoDir)}`
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
