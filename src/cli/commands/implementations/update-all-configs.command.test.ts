import {printShellCommandOutput} from 'augment-vir/dist/node';
import {readdir} from 'fs-extra';
import {testGroup} from 'test-vir';
import {updateAllConfigsTestPaths} from '../../../file-paths/virmator-test-repos-paths';
import {fillInCliFlags} from '../../cli-util/cli-flags';
import {ConfigKey} from '../../config/config-key';
import {readRepoConfigFile} from '../../config/config-read';
import {runUpdateAllConfigsCommand} from './update-all-configs.command';

testGroup({
    description: runUpdateAllConfigsCommand.name,
    tests: (runTest) => {
        runTest({
            /**
             * This test fails sometimes with an error of "undefined". idk why. That's what all the
             * console.logs are for, hopefully we can figure out where the error is coming from. For
             * now, just rerun the tests and then it passes...
             */
            description: 'should not write to files when there will be no output change',
            expect: {
                beforeCount: 1,
                afterCount: 1,
                equivalentPackageJson: true,
                noConfigsWritten: true,
            },
            test: async () => {
                console.log('beforeFiles');
                const beforeFiles = await readdir(updateAllConfigsTestPaths.fullPackageJsonRepo);
                console.log('packageJsonBefore');
                const packageJsonBefore = await readRepoConfigFile(
                    ConfigKey.PackageJson,
                    updateAllConfigsTestPaths.fullPackageJsonRepo,
                    false,
                );

                console.log('commandOutput');
                const commandOutput = await runUpdateAllConfigsCommand({
                    rawArgs: [ConfigKey.PackageJson],
                    cliFlags: fillInCliFlags(),
                    repoDir: updateAllConfigsTestPaths.fullPackageJsonRepo,
                });

                console.log('noConfigsWritten');
                const noConfigsWritten = !!commandOutput.stdout?.includes('All configs up to date');

                if (!commandOutput.success || !noConfigsWritten) {
                    console.log('printShellCommandOutput');
                    printShellCommandOutput(commandOutput);
                }

                console.log('afterFiles');
                const afterFiles = await readdir(updateAllConfigsTestPaths.fullPackageJsonRepo);
                console.log('packageJsonAfter');
                const packageJsonAfter = await readRepoConfigFile(
                    ConfigKey.PackageJson,
                    updateAllConfigsTestPaths.fullPackageJsonRepo,
                    false,
                );

                console.log('return');
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
