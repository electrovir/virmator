import {getNpmBinPath} from '../../file-paths/virmator-package-paths';
import {packageName} from '../../package-name';
import {CliCommandExecutorOutput, defineCliCommand} from '../cli-command/define-cli-command';
import {runVirmatorShellCommand} from '../cli-command/run-shell-command';
import {configFiles} from '../config/config-files';

export const testCommandDefinition = defineCliCommand(
    {
        commandName: 'test',
        subCommandDescriptions: {},
        requiredConfigFiles: [
            configFiles.mocha,
        ],
    } as const,
    ({commandName}) => {
        return {
            sections: [
                {
                    title: '',
                    content: `Test all .test.ts files with Mocha and Chai.  By default this command tests all .test.ts files in the current directory (recursively) that are not .type.test.ts files. To override this behavior, pass in a custom config file using the --config argument. All other Mocha arguments are also valid and will be passed on to Mocha.`,
                },
                {
                    title: '',
                    content: `This command is meant to run Node.js tests. For running web-based testing, see the test-web command.`,
                },
                {
                    title: '',
                    content: `Note that the below single file examples only work because the base Mocha config from ${packageName} is setup to handle them. (So if you don't use that config, the examples may not work properly.)`,
                },
            ],

            examples: [
                {
                    title: 'Test all .test.ts, .test.tsx, .test.js, .test.jsx files',
                    content: `${packageName} ${commandName}`,
                },
                {
                    title: 'Test a single file',
                    content: `${packageName} ${commandName} ./path/to/single/file.js`,
                },
                {
                    title: 'Test multiple files',
                    content: `${packageName} ${commandName} "./**/single-file.js"`,
                },
            ],
        };
    },
    async (inputs): Promise<CliCommandExecutorOutput> => {
        const mochaPath = getNpmBinPath('mocha');
        const joinedArgs = inputs.filteredInputArgs.join(' ');

        const useDefaultConfigArgs = !joinedArgs.includes('--config');
        const configString = useDefaultConfigArgs ? '--config .mocharc.js ' : '';

        const testCommand = `${mochaPath} ${configString} ${joinedArgs}`;

        const results = await runVirmatorShellCommand(testCommand, inputs);

        return {
            fullExecutedCommand: testCommand,
            success: !results.exitCode,
        };
    },
);
