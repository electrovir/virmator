import {CliCommandExecutorOutput, defineCliCommand} from '../cli-command/define-cli-command';
import {configFiles} from '../config/config-files';
import {copyAllConfigFiles, CopyConfigOperation} from '../config/copy-config';

export const updateConfigsCommandDefinition = defineCliCommand(
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
    async (inputs): Promise<CliCommandExecutorOutput> => {
        const success = await copyAllConfigFiles({
            configFiles,
            logging: inputs.logging,
            operation: CopyConfigOperation.Update,
            repoDir: inputs.repoDir,
        });

        return {
            fullExecutedCommand: '',
            success: success,
        };
    },
);
