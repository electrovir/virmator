import {unlink} from 'fs/promises';
import {dirname, join} from 'path';
import {defineCommand} from '../api/command/define-command';
import {NpmDepTypeEnum} from '../api/command/define-command-inputs';
import {compileTs} from '../augments/typescript-config-file';
import {getNpmBinPath, virmatorConfigsDir} from '../file-paths/package-paths';

export const checkDepsCommandDefinition = defineCommand(
    {
        commandName: 'check-deps',
        subCommandDescriptions: {},
        configFiles: {
            depCruiserConfig: {
                copyFromInternalPath: join(virmatorConfigsDir, 'configs', 'dep-cruiser.config.ts'),
                copyToPathRelativeToRepoDir: join('configs', 'dep-cruiser.config.ts'),
            },
        },
        npmDeps: [
            {
                name: 'dependency-cruiser',
                type: NpmDepTypeEnum.Dev,
            },
        ],
    } as const,
    ({commandName, packageBinName}) => {
        return {
            sections: [],
            examples: [],
        };
    },
    async ({repoDir, packageDir, configFiles, filteredInputArgs}) => {
        const depCruiserConfigPath = join(
            repoDir,
            configFiles.depCruiserConfig.copyToPathRelativeToRepoDir,
        );
        const compiledConfigPath = await compileTs({
            inputPath: depCruiserConfigPath,
            outputPath: join(dirname(depCruiserConfigPath), 'dep-cruiser.config.cjs'),
        });
        const pathsToCheck: string[] = filteredInputArgs.length
            ? filteredInputArgs
            : [join(repoDir, 'src')];

        const depCruiseCommand = await getNpmBinPath({
            repoDir: repoDir,
            command: 'depcruise',
            packageDirPath: packageDir,
        });

        return {
            args: [
                depCruiseCommand,
                '--config',
                compiledConfigPath,
                ...pathsToCheck,
            ],
            async postExecute() {
                await unlink(compiledConfigPath);
            },
        };
    },
);
