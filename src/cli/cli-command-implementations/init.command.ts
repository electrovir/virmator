import {awaitedForEach, extractErrorMessage} from 'augment-vir';
import {basename} from 'path';
import {Color} from '../cli-color';
import {CliCommandExecutorOutput, defineCliCommand} from '../cli-command/define-cli-command';
import {configFiles} from '../config/config-files';
import {copyConfig, CopyConfigOperation} from '../config/copy-config';

export const initCommandDefinition = defineCliCommand(
    {
        commandName: 'init',
        subCommandDescriptions: {},
        requiredConfigFiles: [],
    } as const,
    () => {
        return {
            sections: [
                {
                    title: '',
                    content: `Initialize a repo with all virmator configurations.`,
                },
            ],

            examples: [],
        };
    },
    async (inputs): Promise<CliCommandExecutorOutput> => {
        const errors: Error[] = [];
        await awaitedForEach(Object.values(configFiles), async (configFile) => {
            try {
                await copyConfig({
                    configFileDefinition: configFile,
                    operation: CopyConfigOperation.Init,
                    repoDir: inputs.repoDir,
                });
                console.info(
                    `${Color.Info}Successfully copied${Color.Reset} ${basename(configFile.path)}.`,
                );
            } catch (error) {
                const copyError = new Error(
                    `${Color.Fail}Failed to copy${Color.Reset} ${basename(
                        configFile.path,
                    )}: ${extractErrorMessage(error)}`,
                );
                errors.push(copyError);
            }
        });

        errors.forEach((error) => {
            console.error(error.message);
        });

        return {
            fullExecutedCommand: '',
            success: !errors.length,
        };
    },
);
