import {getNpmBinPath} from '../../file-paths/virmator-package-paths';
import {CliCommandExecutorOutput, defineCliCommand} from '../cli-command/define-cli-command';
import {runVirmatorShellCommand} from '../cli-command/run-shell-command';
import {configFiles, getCopyToPath} from '../config/config-files';

export const frontendCommandDefinition = defineCliCommand(
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
    async (inputs): Promise<CliCommandExecutorOutput> => {
        const vitePath = getNpmBinPath('vite');
        const joinedArgs = inputs.filteredInputArgs.join(' ');

        const useDefaultConfigArgs = !joinedArgs.includes('--config');
        const configString = useDefaultConfigArgs
            ? `--config ${getCopyToPath(configFiles.vite, inputs.repoDir)}`
            : '';

        let viteCommand = `${vitePath} --force ${configString} ${joinedArgs}`;

        // insert the build command in either sub command
        if (inputs.inputSubCommands.length) {
            viteCommand = `rm -rf dist && ${vitePath} build ${configString} ${joinedArgs} && cp dist/index.html dist/404.html`;
        }

        if (inputs.inputSubCommands.includes('preview')) {
            const hostString = joinedArgs.includes('--host') ? '' : `--host`;
            viteCommand += ` && ${vitePath} preview ${configString} ${joinedArgs} ${hostString}`;
        }
        const results = await runVirmatorShellCommand(viteCommand, inputs);

        return {
            fullExecutedCommand: viteCommand,
            success: !results.error,
        };
    },
);
