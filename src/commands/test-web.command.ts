import {basename, join} from 'path';
import {defineCommand} from '../api/command/define-command';
import {getNpmBinPath, virmatorConfigsDir} from '../file-paths/package-paths';
import {testCommandDefinition} from './test.command';

export const testWebCommandDefinition = defineCommand(
    {
        commandName: 'test-web',
        subCommandDescriptions: {},
        configFiles: {
            webTestRunner: {
                copyFromInternalPath: join(virmatorConfigsDir, 'web-test-runner-config.mjs'),
                required: true,
            },
        },
        npmDeps: [
            '@open-wc/testing',
            '@web/dev-server-esbuild',
            '@web/test-runner',
            '@web/test-runner-commands',
            '@web/test-runner-playwright',
        ],
    } as const,
    ({commandName, packageBinName, configFiles}) => {
        return {
            sections: [
                {
                    title: '',
                    content: `Runs tests within browsers rather than inside of Node.js. Test files fed into this command cannot be mixed with test files run by the "${packageBinName} ${
                        testCommandDefinition.commandName
                    }" command, as the run-time environment is quite different (Node.js vs browser). However, just like the ${
                        testCommandDefinition.commandName
                    } command, this command will all ".test.ts" files in the current directory (recursively) that are not ".type.test.ts" files. To override this behavior, override the "files" property in ${basename(
                        configFiles.webTestRunner.copyFromInternalPath,
                    )}.`,
                },
                {
                    title: '',
                    content: `By default this command runs all tests three times: in Chromium (Chrome), Firefox, and Webkit (Safari) using playwright.`,
                },
            ],

            examples: [
                {
                    title: 'Test all .test.ts and .test.tsx files',
                    content: `${packageBinName} ${commandName}`,
                },
                {
                    title: 'Test a specific file',
                    content: `${packageBinName} ${commandName} path/to/file.test.ts`,
                },
            ],
        };
    },
    (inputs) => {
        const shouldUseConfig = !inputs.filteredInputArgs.includes('--config');
        const configString = shouldUseConfig
            ? `--config ./.virmator/web-test-runner.config.mjs`
            : '';

        return {
            mainCommand: getNpmBinPath('web-test-runner'),
            args: [
                '--color',
                configString,
                ...inputs.filteredInputArgs,
            ],
        };
    },
);
