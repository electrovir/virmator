import {getNpmBinPath} from '../../file-paths/virmator-package-paths';
import {CliCommandExecutorOutput, defineCliCommand} from '../cli-command/define-cli-command';
import {runVirmatorShellCommand} from '../cli-command/run-shell-command';
import {configFiles} from '../config/config-files';

function spellcheckLogTransform(log: string): string {
    return log.replace(/\r/g, '\n').replace(/\n$/, '');
}

export const spellcheckCommandDefinition = defineCliCommand(
    {
        commandName: 'spellcheck',
        subCommandDescriptions: {},
        requiredConfigFiles: [
            configFiles.cSpell,
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
    async (inputs): Promise<CliCommandExecutorOutput> => {
        const cSpellPath = getNpmBinPath('cspell');
        const args = inputs.filteredInputArgs.length
            ? inputs.filteredInputArgs.join(' ')
            : '--no-progress --relative --dot "**/*"';
        const spellcheckCommand = `${cSpellPath} --color ${args}`;
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
