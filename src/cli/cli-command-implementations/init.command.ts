import {packageName} from '../../package-name';
import {CliCommandExecutorOutput, defineCliCommand} from '../cli-command/define-cli-command';
import {configFiles} from '../config/config-files';
import {copyAllConfigFiles, CopyConfigOperation} from '../config/copy-config';

export const initCommandDefinition = defineCliCommand(
    {
        commandName: 'init',
        subCommandDescriptions: {
            force: 'force overwrite files even if they already exist.',
        },
    } as const,
    ({commandName, subCommands}) => {
        return {
            sections: [
                {
                    title: '',
                    content: `Initialize a repo with all virmator config files.`,
                },
            ],
            examples: [
                {
                    title: 'run init and force all configs to be written',
                    content: `${packageName} ${commandName} ${subCommands.force}`,
                },
            ],
        };
    },
    async (inputs): Promise<CliCommandExecutorOutput> => {
        const copyStyle = inputs.inputSubCommands.includes(inputs.subCommands.force)
            ? CopyConfigOperation.Overwrite
            : CopyConfigOperation.Init;

        const success = await copyAllConfigFiles({
            configFiles,
            logging: inputs.logging,
            operation: copyStyle,
            repoDir: inputs.repoDir,
        });

        return {
            fullExecutedCommand: '',
            success: success,
        };
    },
);
