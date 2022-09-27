import {defaultConsoleLogging} from '../api/command/command-logging';
import {defineCommand} from '../api/command/define-command';
import {copyAllConfigFiles, CopyConfigOperation} from '../api/config/copy-config';
import {nonCommandConfigs} from './extra-configs/all-extra-configs';
import {formatCommandDefinition} from './format.command';

export const initCommandDefinition = defineCommand(
    {
        commandName: 'init',
        subCommandDescriptions: {
            force: 'force overwrite files even if they already exist.',
        },
        configFiles: {},
        npmDeps: [...formatCommandDefinition.npmDeps],
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
                    title: 'run init',
                    content: `${packageBinName} ${commandName}`,
                },
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

        const allConfigs = [
            ...nonCommandConfigs,
            ...inputs.allConfigs,
        ];

        const success = await copyAllConfigFiles({
            configFiles: allConfigs,
            logging: defaultConsoleLogging,
            operation: copyStyle,
            repoDir: inputs.repoDir,
            packageDir: inputs.packageDir,
        });

        return {
            success,
        };
    },
);
