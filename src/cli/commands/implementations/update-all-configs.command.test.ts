import {printShellCommandOutput} from 'augment-vir/dist/node-index';
import {readdir} from 'fs/promises';
import {updateAllConfigsTestPaths} from '../../../file-paths/virmator-test-file-paths';
import {fillInCliFlags} from '../../cli-util/cli-flags';
import {getAllCommandOutput} from '../../cli-util/get-all-command-output';
import {ConfigKey} from '../../config/config-key';
import {readRepoConfigFile} from '../../config/config-read';
import {EmptyOutputCallbacks} from '../cli-command';
import {runUpdateAllConfigsCommand} from './update-all-configs.command';

describe(runUpdateAllConfigsCommand.name, () => {
    it('should not write to files when there will be no output change', async () => {
        expect((await readdir(updateAllConfigsTestPaths.fullPackageJsonRepo)).length).toBe(1);
        const packageJsonBefore = await readRepoConfigFile(
            ConfigKey.PackageJson,
            updateAllConfigsTestPaths.fullPackageJsonRepo,
            false,
        );

        const commandOutput = await getAllCommandOutput(runUpdateAllConfigsCommand, {
            rawArgs: [ConfigKey.PackageJson],
            cliFlags: fillInCliFlags(),
            repoDir: updateAllConfigsTestPaths.fullPackageJsonRepo,
            ...EmptyOutputCallbacks,
        });

        const noConfigsWritten = !!commandOutput.stdout?.includes('All configs up to date');
        expect(noConfigsWritten).toBe(true);

        if (!commandOutput.success || !noConfigsWritten) {
            printShellCommandOutput(commandOutput);
        }

        expect((await readdir(updateAllConfigsTestPaths.fullPackageJsonRepo)).length).toBe(1);
        expect(
            await readRepoConfigFile(
                ConfigKey.PackageJson,
                updateAllConfigsTestPaths.fullPackageJsonRepo,
                false,
            ),
        ).toEqual(packageJsonBefore);
    });
});
