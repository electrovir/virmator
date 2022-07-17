import {CliCommandExecutorOutput, defineCliCommand} from '../cli-command/define-cli-command';
import {configFiles} from '../config/config-files';
import {copyAllConfigFiles, CopyConfigOperation} from '../config/copy-config';

export const initCommandDefinition = defineCliCommand(
    {
        commandName: 'init',
        subCommandDescriptions: {},
    } as const,
    () => {
        return {
            sections: [
                {
                    title: '',
                    content: `Initialize a repo with all virmator config files.`,
                },
            ],

            examples: [],
        };
    },
    async (inputs): Promise<CliCommandExecutorOutput> => {
        const success = await copyAllConfigFiles({
            configFiles,
            logging: inputs.logging,
            operation: CopyConfigOperation.Init,
            repoDir: inputs.repoDir,
        });

        return {
            fullExecutedCommand: '',
            success: success,
        };
    },
);
