import {defaultConsoleLogging} from '../api/command/command-logging';
import {defineCommand} from '../api/command/define-command';
import {copyAllConfigFiles, CopyConfigOperation} from '../cli-old/copy-config';

export const updateConfigsCommandDefinition = defineCommand(
    {
        commandName: 'update-configs',
        subCommandDescriptions: {},
    } as const,
    () => {
        return {
            sections: [
                {
                    title: '',
                    content: `Update all existing configuration files that virmator is able to update. (Like base config files.)`,
                },
            ],

            examples: [],
        };
    },
    async (inputs) => {
        const success = await copyAllConfigFiles({
            configFiles: inputs.allConfigs,
            logging: defaultConsoleLogging,
            operation: CopyConfigOperation.Update,
            repoDir: inputs.repoDir,
        });

        return {success};
    },
);
