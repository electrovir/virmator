import {join} from 'path';
import {defineCommand} from '../api/command/define-command';
import {getNpmBinPath, virmatorConfigsDir} from '../file-paths/package-paths';

export const testCommandDefinition = defineCommand(
    {
        commandName: 'test',
        subCommandDescriptions: {},
        configFiles: {
            mochaConfig: {
                copyFromInternalPath: join(virmatorConfigsDir, 'configs', 'mocha.config.js'),
                copyToPathRelativeToRepoDir: join('configs', 'mocha.config.js'),
            },
            nycConfig: {
                copyFromInternalPath: join(virmatorConfigsDir, 'configs', 'nyc.config.js'),
                copyToPathRelativeToRepoDir: join('configs', 'nyc.config.js'),
            },
        },
        npmDeps: [
            '@electrovir/nyc',
            '@istanbuljs/nyc-config-typescript',
            '@types/chai',
            '@types/mocha',
            'chai',
            'istanbul-smart-text-reporter',
            'mocha-spec-reporter-with-file-names',
            'mocha',
            'ts-node',
        ],
    } as const,
    ({commandName, packageBinName}) => {
        return {
            sections: [
                {
                    title: '',
                    content: `Test all .test.ts files with Mocha and Chai.  By default this command tests all ".test.ts" files in the current directory (recursively) that are not ".type.test.ts" files. To override this behavior, override the "spec" property in .mocharc.js.`,
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

        const useDefaultNycConfigPath = !inputs.filteredInputArgs.includes('--nycrc-path');
        const nycConfigFlag = useDefaultNycConfigPath
            ? `--nycrc-path '${inputs.configFiles.nycConfig.copyToPathRelativeToRepoDir}'`
            : '';

        return {
            mainCommand: await getNpmBinPath(inputs.repoDir, 'nyc'),
            args: [
                // force colors in nyc
                '--colors',
                nycConfigFlag,
                await getNpmBinPath(inputs.repoDir, 'mocha'),
                // force colors in mocha
                '--colors',
                configString,
                ...inputs.filteredInputArgs,
            ],
        };
    },
);
