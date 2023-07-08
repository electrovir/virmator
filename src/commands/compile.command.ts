import {join} from 'path';
import {defineCommand} from '../api/command/define-command';
import {NpmDepTypeEnum} from '../api/command/define-command-inputs';
import {getNpmBinPath, virmatorConfigsDir} from '../file-paths/package-paths';

export const compileCommandDefinition = defineCommand(
    {
        commandName: 'compile',
        subCommandDescriptions: {
            check: 'Run type checking without emitting compiled files.',
        },
        configFiles: {
            tsConfig: {
                copyFromInternalPath: join(virmatorConfigsDir, 'tsconfig.json'),
                copyToPathRelativeToRepoDir: 'tsconfig.json',
            },
        },
        npmDeps: [
            {name: 'typescript', type: NpmDepTypeEnum.Dev},
        ],
    } as const,
    ({commandName, packageBinName}) => {
        return {
            sections: [
                {
                    title: '',
                    content: `compile typescript files
                    Pass any extra tsc flags to this command.`,
                },
            ],
            examples: [
                {
                    title: `no extra flags`,
                    content: `${packageBinName} ${commandName}`,
                },
                {
                    title: `one extra flag`,
                    content: `${packageBinName} ${commandName} --noEmit`,
                },
            ],
        };
    },
    async (inputs) => {
        const shouldNotEmit =
            inputs.filteredInputArgs.join(' ').includes('--noEmit') ||
            inputs.inputSubCommands.includes(inputs.subCommands.check);
        const noEmit = shouldNotEmit ? '--noEmit' : '';

        const mainCommand = await getNpmBinPath({
            repoDir: inputs.repoDir,
            command: 'tsc',
            packageDirPath: inputs.packageDir,
        });

        return {
            args: [
                `rm -rf dist && ${mainCommand}`,
                noEmit,
                ...inputs.filteredInputArgs.map((arg) => `"${arg}"`),
            ],
        };
    },
);
