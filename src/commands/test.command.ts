import {join} from 'path';
import {defineCommand} from '../api/command/define-command';
import {NpmDepTypeEnum} from '../api/command/define-command-inputs';
import {getNpmBinPath, virmatorConfigsDir} from '../file-paths/package-paths';

export const testCommandDefinition = defineCommand(
    {
        commandName: 'test',
        subCommandDescriptions: {
            coverage:
                'run tests with code coverage calculations. This will often result in incorrect stack traces on errors, so this is only recommended after having first gotten all tests to pass without coverage calculations.',
        },
        configFiles: {
            mochaConfig: {
                copyFromInternalPath: join(virmatorConfigsDir, 'configs', 'mocha.config.cjs'),
                copyToPathRelativeToRepoDir: join('configs', 'mocha.config.cjs'),
            },
            nycConfig: {
                copyFromInternalPath: join(virmatorConfigsDir, 'configs', 'nyc.config.cjs'),
                copyToPathRelativeToRepoDir: join('configs', 'nyc.config.cjs'),
            },
        },
        npmDeps: [
            {name: '@electrovir/nyc', type: NpmDepTypeEnum.Dev},
            {name: '@istanbuljs/nyc-config-typescript', type: NpmDepTypeEnum.Dev},
            {name: '@types/chai', type: NpmDepTypeEnum.Dev},
            {name: '@types/mocha', type: NpmDepTypeEnum.Dev},
            {name: 'chai', type: NpmDepTypeEnum.Dev},
            {name: 'istanbul-smart-text-reporter', type: NpmDepTypeEnum.Dev},
            {name: 'mocha-spec-reporter-with-file-names', type: NpmDepTypeEnum.Dev},
            {name: 'mocha', type: NpmDepTypeEnum.Dev},
            {name: 'ts-node', type: NpmDepTypeEnum.Dev},
        ],
    } as const,
    ({commandName, packageBinName}) => {
        return {
            sections: [
                {
                    title: '',
                    content: `Test all .test.ts files with Mocha and Chai.  By default this command tests all ".test.ts" files in the current directory (recursively) that are not ".type.test.ts" files. To override this behavior, override the "spec" property in .mocharc.cjs.`,
                },
                {
                    title: '',
                    content: `This command is meant to run Node.js tests. For running web-based testing, see the test-web command.`,
                },
                {
                    title: '',
                    content: `Note that the below single file examples only work because the base Mocha config from ${packageBinName} is setup to handle them. (So if you don't use that config, the examples may not work properly.)`,
                },
            ],

            examples: [
                {
                    title: 'Test all .test.ts and .test.tsx files',
                    content: `${packageBinName} ${commandName}`,
                },
                {
                    title: 'Test a single file',
                    content: `${packageBinName} ${commandName} ./path/to/single/file.js`,
                },
                {
                    title: 'Test multiple files',
                    content: `${packageBinName} ${commandName} "./**/single-file.js"`,
                },
            ],
        };
    },
    async (inputs) => {
        const useDefaultConfigArgs = !inputs.filteredInputArgs.includes('--config');
        const configString = useDefaultConfigArgs
            ? `--config '${inputs.configFiles.mochaConfig.copyToPathRelativeToRepoDir}'`
            : '';

        const includeCoverage = inputs.inputSubCommands.includes(inputs.subCommands.coverage);

        const useDefaultNycConfigPath = !inputs.filteredInputArgs.includes('--nycrc-path');
        const nycConfigFlag = useDefaultNycConfigPath
            ? `--nycrc-path '${inputs.configFiles.nycConfig.copyToPathRelativeToRepoDir}'`
            : '';

        return {
            args: [
                ...(includeCoverage
                    ? [
                          await getNpmBinPath({
                              repoDir: inputs.repoDir,
                              command: 'electrovir-nyc',
                              packageDirPath: inputs.packageDir,
                          }),
                          // force colors in nyc
                          '--colors',
                          nycConfigFlag,
                      ]
                    : []),
                await getNpmBinPath({
                    repoDir: inputs.repoDir,
                    command: 'mocha',
                    packageDirPath: inputs.packageDir,
                }),
                // force colors in mocha
                '--colors',
                configString,
                ...inputs.filteredInputArgs,
            ],
        };
    },
);
