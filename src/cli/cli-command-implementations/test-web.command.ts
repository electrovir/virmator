import {basename} from 'path';
import {getNpmBinPath} from '../../file-paths/virmator-package-paths';
import {packageName} from '../../package-name';
import {CliCommandExecutorOutput, defineCliCommand} from '../cli-command/define-cli-command';
import {runVirmatorShellCommand} from '../cli-command/run-shell-command';
import {configFiles} from '../config/config-files';
import {testCommandDefinition} from './test.command';

export const testWebCommandDefinition = defineCliCommand(
    {
        commandName: 'test-web',
        subCommandDescriptions: {},
        requiredConfigFiles: [
            configFiles.webTestRunner,
        ],
    } as const,
    ({commandName}) => {
        return {
            sections: [
                {
                    title: '',
                    content: `Runs tests within browsers rather than inside of Node.js. Test files fed into this command cannot be mixed with test files run by the "${packageName} ${
                        testCommandDefinition.commandName
                    }" command, as the run-time environment is quite different (Node.js vs browser). However, just like the ${
                        testCommandDefinition.commandName
                    } command, this command will all ".test.ts" files in the current directory (recursively) that are not ".type.test.ts" files. To override this behavior, override the "files" property in ${basename(
                        configFiles.webTestRunner.path,
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
                    content: `${packageName} ${commandName}`,
                },
                {
                    title: 'Test a specific file',
                    content: `${packageName} ${commandName} path/to/file.test.ts`,
                },
            ],
        };
    },
    async (inputs): Promise<CliCommandExecutorOutput> => {
        const webTestRunnerPath = getNpmBinPath('web-test-runner');
        const joinedArgs = inputs.filteredInputArgs.join(' ');

        const shouldUseConfig = !joinedArgs.includes('--config');
        const configString = shouldUseConfig
            ? `--config ./.virmator/web-test-runner.config.mjs`
            : '';

        const testCommand = `${webTestRunnerPath} ${configString} ${joinedArgs}`;

        const results = await runVirmatorShellCommand(testCommand, inputs);

        return {
            fullExecutedCommand: testCommand,
            success: !results.exitCode,
        };
    },
);
