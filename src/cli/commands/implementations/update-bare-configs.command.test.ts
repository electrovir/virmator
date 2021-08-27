import {emptyDir, ensureDir, existsSync} from 'fs-extra';
import {join} from 'path';
import {testGroup} from 'test-vir';
import {getEnumTypedValues} from '../../../augments/object';
import {updateBareConfigsTestPaths} from '../../../virmator-repo-paths';
import {fillInCliFlags} from '../../cli-util/cli-flags';
import {BareConfigKey, configFileMap} from '../../config/configs';
import {
    extractUpdateBareConfigsArgs,
    runUpdateBareConfigsCommand,
} from './update-bare-configs.command';

testGroup({
    description: runUpdateBareConfigsCommand.name,
    tests: (runTest) => {
        const allBareConfigKeys = getEnumTypedValues(BareConfigKey);

        runTest({
            description: 'all config files were written without error',
            expect: allBareConfigKeys.sort(),
            test: async () => {
                /**
                 * Since this folder is literally empty, it doesn't get added to git and we have to
                 * recreate it.
                 */
                await ensureDir(updateBareConfigsTestPaths.emptyRepo);

                const configsExistedAlready: boolean[] = allBareConfigKeys.map((currentKey) => {
                    return existsSync(
                        join(updateBareConfigsTestPaths.emptyRepo, configFileMap[currentKey]),
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

                const commandOutput = await runUpdateBareConfigsCommand({
                    rawArgs: [],
                    cliFlags: fillInCliFlags(),
                    customDir: updateBareConfigsTestPaths.emptyRepo,
                });

                if (!commandOutput.success) {
                    console.error(
                        `Update bare configs command failed: ${JSON.stringify(
                            commandOutput,
                            null,
                            4,
                        )}`,
                    );
                    console.error(commandOutput.error);
                }

                const writtenConfigs: BareConfigKey[] = allBareConfigKeys.filter((configKey) => {
                    return (
                        commandOutput.stdout.includes(configKey) &&
                        !commandOutput.stderr.includes(configKey) &&
                        commandOutput.success &&
                        existsSync(
                            join(updateBareConfigsTestPaths.emptyRepo, configFileMap[configKey]),
                        )
                    );
                });

                try {
                    await emptyDir(updateBareConfigsTestPaths.emptyRepo);
                } catch (error) {}

                const configsDeleted: boolean[] = await Promise.all(
                    allBareConfigKeys.map(async (configKey) => {
                        return !existsSync(
                            join(updateBareConfigsTestPaths.emptyRepo, configFileMap[configKey]),
                        );
                    }),
                );

                return writtenConfigs
                    .filter((writtenConfig, index) => {
                        if (configsExistedAlready[index]) {
                            console.error(
                                `"${writtenConfig}" already existed before running the test`,
                            );
                            return false;
                        }
                        if (!configsDeleted[index]) {
                            console.error(`"${writtenConfig}" was not removed after the test`);
                            return false;
                        }

                        return true;
                    })
                    .sort();
            },
        });
    },
});

testGroup({
    description: extractUpdateBareConfigsArgs.name,
    tests: (runTest) => {
        runTest({
            description: 'empty args array results in config files array',
            expect: [],
            test: () => {
                return extractUpdateBareConfigsArgs([]);
            },
        });

        runTest({
            description: 'excludes strings that are not valid config files',
            expect: [],
            test: () => {
                return extractUpdateBareConfigsArgs(['abcdef', 'quick', 'eat the tofu']);
            },
        });

        runTest({
            description: 'includes valid config file strings',
            expect: [BareConfigKey.GitIgnore, BareConfigKey.NpmIgnore],
            test: () => {
                return extractUpdateBareConfigsArgs([
                    'abcdef',
                    'quick',
                    'eat the tofu',
                    BareConfigKey.GitIgnore,
                    BareConfigKey.NpmIgnore,
                ]);
            },
        });

        runTest({
            description: 'output is sorted',
            expect: [
                BareConfigKey.GitHubActionsTest,
                BareConfigKey.GitIgnore,
                BareConfigKey.NpmIgnore,
            ],
            test: () => {
                return extractUpdateBareConfigsArgs([
                    'quick',
                    'eat the tofu',
                    BareConfigKey.GitIgnore,
                    BareConfigKey.NpmIgnore,
                    BareConfigKey.GitHubActionsTest,
                ]);
            },
        });
    },
});
