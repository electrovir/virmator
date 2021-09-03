import {readdir} from 'fs-extra';
import {testGroup} from 'test-vir';
import {printCommandOutput} from '../../../augments/bash';
import {updateAllConfigsTestPaths} from '../../../file-paths/virmator-test-repos-paths';
import {fillInCliFlags} from '../../cli-util/cli-flags';
import {ConfigKey} from '../../config/config-key';
import {readRepoConfigFile} from '../../config/config-read';
import {runUpdateAllConfigsCommand} from './update-all-configs.command';

testGroup({
    description: runUpdateAllConfigsCommand.name,
    tests: (runTest) => {
        runTest({
            description: 'should not write to files when there will be no output change',
            expect: {
                beforeCount: 1,
                afterCount: 1,
                equivalentPackageJson: true,
                noConfigsWritten: true,
            },
            test: async () => {
                const beforeFiles = await readdir(updateAllConfigsTestPaths.fullPackageJsonRepo);
                const packageJsonBefore = await readRepoConfigFile(
                    ConfigKey.PackageJson,
                    false,
                    updateAllConfigsTestPaths.fullPackageJsonRepo,
                );

                const commandOutput = await runUpdateAllConfigsCommand({
                    rawArgs: [ConfigKey.PackageJson],
                    cliFlags: fillInCliFlags(),
                    repoDir: updateAllConfigsTestPaths.fullPackageJsonRepo,
                });

                const noConfigsWritten = !!commandOutput.stdout?.includes('All configs up to date');

                if (!commandOutput.success || !noConfigsWritten) {
                    printCommandOutput(commandOutput);
                }

                const afterFiles = await readdir(updateAllConfigsTestPaths.fullPackageJsonRepo);
                const packageJsonAfter = await readRepoConfigFile(
                    ConfigKey.PackageJson,
                    false,
                    updateAllConfigsTestPaths.fullPackageJsonRepo,
                );

                return {
                    beforeCount: beforeFiles.length,
                    afterCount: afterFiles.length,
                    equivalentPackageJson: packageJsonAfter === packageJsonBefore,
                    noConfigsWritten,
                };
            },
        });
    },
});
