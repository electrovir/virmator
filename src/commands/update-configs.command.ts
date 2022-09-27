import {defaultConsoleLogging} from '../api/command/command-logging';
import {defineCommand} from '../api/command/define-command';
import {copyAllConfigFiles, CopyConfigOperation} from '../api/config/copy-config';
import {nonCommandConfigs} from './extra-configs/all-extra-configs';

export const updateConfigsCommandDefinition = defineCommand(
    {
        commandName: 'update-configs',
        subCommandDescriptions: {},
        configFiles: {},
        npmDeps: [],
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
            packageDir: inputs.packageDir,
            configFiles: [
                ...inputs.allConfigs,
                ...nonCommandConfigs,
            ],
            logging: defaultConsoleLogging,
            operation: CopyConfigOperation.Update,
            repoDir: inputs.repoDir,
        });

        return {success};
    },
);
