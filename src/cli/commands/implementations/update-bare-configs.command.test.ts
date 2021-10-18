import {getEnumTypedValues} from 'augment-vir/dist/node';
import {emptyDir, ensureDir, existsSync} from 'fs-extra';
import {join} from 'path';
import {testGroup} from 'test-vir';
import {updateBareConfigsTestPaths} from '../../../file-paths/virmator-test-repos-paths';
import {fillInCliFlags} from '../../cli-util/cli-flags';
import {getAllCommandOutput} from '../../cli-util/get-all-command-output';
import {BareConfigKey} from '../../config/config-key';
import {getRepoConfigFilePath} from '../../config/config-paths';
import {EmptyOutputCallbacks} from '../cli-command';
import {runUpdateBareConfigsCommand} from './update-bare-configs.command';

testGroup({
    description: runUpdateBareConfigsCommand.name,
    tests: (runTest) => {
        const allBareConfigKeys = getEnumTypedValues(BareConfigKey);

        runTest({
            description: 'no config files were written with errors',
            expect: [],
            test: async () => {
                /**
                 * Since this folder is literally empty, it doesn't get added to git and we have to
                 * recreate it.
                 */
                await ensureDir(updateBareConfigsTestPaths.emptyRepo);

                const configsExistedAlready: boolean[] = allBareConfigKeys.map((currentKey) => {
                    return existsSync(
                        join(
                            updateBareConfigsTestPaths.emptyRepo,
                            getRepoConfigFilePath(currentKey, false),
                        ),
                    );
                });

                const alreadyExistingByKey = allBareConfigKeys.filter((_, index) => {
                    return configsExistedAlready[index];
                });

                if (alreadyExistingByKey.length) {
                    console.error(
                        `Already existing bare configs: ${alreadyExistingByKey.join(', ')}`,
                    );
                }

                const commandOutput = await getAllCommandOutput(runUpdateBareConfigsCommand, {
                    rawArgs: [],
                    cliFlags: fillInCliFlags(),
                    repoDir: updateBareConfigsTestPaths.emptyRepo,
                    ...EmptyOutputCallbacks,
                });

                if (commandOutput.stderr) {
                    console.error(commandOutput.stderr);
                }

                if (!commandOutput.success) {
                    console.error(
                        `Update bare configs command failed: ${JSON.stringify(
                            commandOutput,
                            null,
                            4,
                        )}`,
                    );
                }

                const {writtenConfigs, invalidConfigs} = allBareConfigKeys.reduce(
                    (accum, configKey) => {
                        const stdoutHasKey = commandOutput.stdout?.includes(configKey);
                        const stderrHasKey = commandOutput.stderr?.includes(configKey);
                        const writtenPath = join(
                            updateBareConfigsTestPaths.emptyRepo,
                            getRepoConfigFilePath(configKey, false),
                        );
                        const configWasWritten = existsSync(writtenPath);

                        const writtenSuccessfully =
                            stdoutHasKey && !stderrHasKey && configWasWritten;

                        if (writtenSuccessfully) {
                            accum.writtenConfigs.push(configKey);
                        } else {
                            console.error({
                                writtenPath,
                                configKey,
                                stdoutHasKey,
                                stderrHasKey,
                                configWasWritten,
                            });
                            accum.invalidConfigs.push(configKey);
                        }
                        return accum;
                    },
                    {writtenConfigs: [] as BareConfigKey[], invalidConfigs: [] as BareConfigKey[]},
                );

                try {
                    await emptyDir(updateBareConfigsTestPaths.emptyRepo);
                } catch (error) {}

                const configsDeleted: boolean[] = await Promise.all(
                    writtenConfigs.map(async (configKey) => {
                        return !existsSync(
                            join(
                                updateBareConfigsTestPaths.emptyRepo,
                                getRepoConfigFilePath(configKey, false),
                            ),
                        );
                    }),
                );

                const failures = [
                    ...invalidConfigs,
                    ...writtenConfigs.filter((writtenConfig, index) => {
                        if (alreadyExistingByKey.includes(writtenConfig)) {
                            console.error(
                                `"${writtenConfig}" already existed before running the test`,
                            );
                            return true;
                        }
                        if (!configsDeleted[index]) {
                            console.error(`"${writtenConfig}" was not removed after the test`);
                            return true;
                        }

                        return false;
                    }),
                ];

                if (failures.length) {
                    console.log(JSON.stringify(commandOutput, null, 4));
                }

                return failures;
            },
        });
    },
});
