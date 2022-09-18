import {join} from 'path';
import {defineCommand} from '../api/command/define-command';
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
                required: true,
            },
        },
        npmDeps: ['cspell'],
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
    (inputs) => {
        const containsNonFlagArgs = inputs.filteredInputArgs.some((arg) => !arg.startsWith('-'));

        const fileArg = containsNonFlagArgs ? '' : '"**/*"';

        return {
            mainCommand: getNpmBinPath('cspell'),
            args: [
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
