import {defaultConsoleLogging} from '../api/command/command-logging';
import {defineCommand} from '../api/command/define-command';
import {copyAllConfigFiles, CopyConfigOperation} from '../cli-old/copy-config';

export const initCommandDefinition = defineCommand(
    {
        commandName: 'init',
        subCommandDescriptions: {
            force: 'force overwrite files even if they already exist.',
        },
    } as const,
    ({commandName, subCommands, packageBinName}) => {
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
                    content: `${packageBinName} ${commandName} ${subCommands.force}`,
                },
            ],
        };
    },
    async (inputs) => {
        const copyStyle = inputs.inputSubCommands.includes(inputs.subCommands.force)
            ? CopyConfigOperation.Overwrite
            : CopyConfigOperation.Init;

        const success = await copyAllConfigFiles({
            configFiles: inputs.allConfigs,
            logging: defaultConsoleLogging,
            operation: copyStyle,
            repoDir: inputs.repoDir,
        });

        return {
            success,
        };
    },
);
