import {join} from 'path';
import {defineCommand} from '../api/command/define-command';
import {NpmDepTypeEnum} from '../api/command/define-command-inputs';
import {getNpmBinPath, virmatorConfigsDir} from '../file-paths/package-paths';

function spellcheckLogTransform(log: string): string {
    return log.replace(/\r/g, '\n').replace(/\n$/, '');
}

export const spellcheckCommandDefinition = defineCommand(
    {
        commandName: 'spellcheck',
        subCommandDescriptions: {},
        configFiles: {
            cspell: {
                copyFromInternalPath: join(virmatorConfigsDir, 'cspell.config.js'),
                copyToPathRelativeToRepoDir: 'cspell.config.js',
            },
        },
        npmDeps: [
            {name: 'cspell', type: NpmDepTypeEnum.Dev},
        ],
    } as const,
    () => {
        return {
            sections: [
                {
                    title: '',
                    content: `Spellcheck code with cspell. By default this spellchecks every file in the entire repo (except for those ignored in the config file), including .dot files. If any arguments are passed to this command, the default cspell args that this command applies are ignored, you'll have to supply them via your args.`,
                },
            ],
            examples: [],
        };
    },
    async (inputs) => {
        const containsNonFlagArgs = inputs.filteredInputArgs.some((arg) => !arg.startsWith('-'));

        const fileArg = containsNonFlagArgs ? '' : '"**/*"';
        const configArg = inputs.filteredInputArgs.includes('--config')
            ? ''
            : `--config ${inputs.configFiles.cspell.copyToPathRelativeToRepoDir}`;

        return {
            args: [
                await getNpmBinPath({
                    repoDir: inputs.repoDir,
                    command: 'cspell',
                    packageDirPath: inputs.packageDir,
                }),
                configArg,
                '--color',
                '--unique',
                '--no-progress',
                '--relative',
                '--dot',
                ...inputs.filteredInputArgs,
                fileArg,
            ],
            logTransforms: {
                stderr: spellcheckLogTransform,
                stdout: spellcheckLogTransform,
            },
        };
    },
);
