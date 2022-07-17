import {getNpmBinPath} from '../../file-paths/virmator-package-paths';
import {CliCommandExecutorOutput, defineCliCommand} from '../cli-command/define-cli-command';
import {runVirmatorShellCommand} from '../cli-command/run-shell-command';

function spellcheckLogTransform(log: string): string {
    return log.replace(/\r/g, '\n').replace(/\n$/, '');
}

export const spellcheckCommandDefinition = defineCliCommand(
    {
        commandName: 'spellcheck',
        subCommandDescriptions: {},
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
    async (inputs): Promise<CliCommandExecutorOutput> => {
        const cSpellPath = getNpmBinPath('cspell');
        const extraArgs = inputs.filteredInputArgs.join(' ');
        const containsNonFlagArgs = inputs.filteredInputArgs.some((arg) => !arg.startsWith('-'));

        const args = containsNonFlagArgs ? '' : '"**/*"';
        const spellcheckCommand = `${cSpellPath} --color --unique --no-progress --relative --dot ${extraArgs} ${args}`;
        const results = await runVirmatorShellCommand(spellcheckCommand, {
            ...inputs,
            logTransforms: {
                stderr: spellcheckLogTransform,
                stdout: spellcheckLogTransform,
            },
        });

        return {
            fullExecutedCommand: spellcheckCommand,
            success: !results.exitCode,
        };
    },
);
