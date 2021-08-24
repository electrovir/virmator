import {existsSync, unlink} from 'fs-extra';
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

async function testUpdateBareConfigs({
    customDir,
    rawArgs = [],
}: {
    customDir?: string;
    rawArgs?: string[];
} = {}) {
    const results = await runUpdateBareConfigsCommand({
        rawArgs,
        cliFlags: fillInCliFlags(),
        customDir,
    });

    return results;
}

testGroup({
    description: runUpdateBareConfigsCommand.name,
    tests: (runTest) => {
        const allBareConfigKeys = getEnumTypedValues(BareConfigKey);

        runTest({
            description: 'all config files were written without error',
            expect: allBareConfigKeys.sort(),
            test: async () => {
                const commandOutput = await testUpdateBareConfigs({
                    customDir: updateBareConfigsTestPaths.emptyRepo,
                });

                const configsExistedAlready: boolean[] = allBareConfigKeys.map((currentKey) => {
                    return existsSync(
                        join(updateBareConfigsTestPaths.emptyRepo, configFileMap[currentKey]),
                    );
                });

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

                const configsDeleted: boolean[] = await Promise.all(
                    allBareConfigKeys.map(async (configKey) => {
                        const configFile = configFileMap[configKey];
                        const configPath = join(updateBareConfigsTestPaths.emptyRepo, configFile);
                        await unlink(configPath);
                        return existsSync(
                            join(updateBareConfigsTestPaths.emptyRepo, configFileMap[configKey]),
                        );
                    }),
                );

                console.log(commandOutput.stdout);
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
            expect: ['GitIgnore', 'NpmIgnore'],
            test: () => {
                return extractUpdateBareConfigsArgs([
                    'abcdef',
                    'quick',
                    'eat the tofu',
                    'GitIgnore',
                    'NpmIgnore',
                ]);
            },
        });

        runTest({
            description: 'ignores the actual file paths in the bare config enum',
            expect: ['GitIgnore', 'NpmIgnore'],
            test: () => {
                return extractUpdateBareConfigsArgs([
                    BareConfigKey.GitHubActionsTest,
                    'quick',
                    'eat the tofu',
                    'GitIgnore',
                    'NpmIgnore',
                ]);
            },
        });
    },
});
