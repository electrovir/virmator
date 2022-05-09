import {interpolationSafeWindowsPath} from 'augment-vir/dist/node-only';
import {CommandConfigKey} from '../../../cli/config/config-key';
import {getRepoConfigFilePath} from '../../../cli/config/config-paths';
import {getNpmBinPath} from '../../../file-paths/virmator-repo-paths';
import {runVirmatorShellCommand} from '../../cli-command/run-shell-command';
import {CliCommandName} from '../../cli-shared/cli-command-name';
import {CliFlagName} from '../../cli-shared/cli-flags';
import {CliCommandImplementation, CliCommandResult, CommandFunctionInput} from '../cli-command';

export const testCommandImplementation: CliCommandImplementation = {
    commandName: CliCommandName.Test,
    description: {
        sections: [
            {
                title: '',
                content: `Test all .test.ts files with jest.  By default this command tests all .test.ts files in the current directory that are not .type.test.ts files. To override this behavior, pass in a custom config file with Jest's --config argument. The default Jest config file can be extended by importing it with "import {virmatorJestConfig} from 'virmator'". All other Jest inputs are also valid.`,
            },
        ],

        examples: [
            {title: '', content: `virmator test ./path/to/single/file.js`},
            {title: '', content: `virmator test "./**/single-file.js"`},
            {title: '', content: `virmator test "./dist/**/!(*.type).test.js"`},
        ],
    },
    implementation: runTestCommand,
    configKeys: [
        CommandConfigKey.JestSetup,
        CommandConfigKey.JestConfig,
    ],
    configFlagSupport: {
        [CliFlagName.NoWriteConfig]: true,
    },
};

const jestPath = getNpmBinPath('jest');

export async function runTestCommand(inputs: CommandFunctionInput): Promise<CliCommandResult> {
    const args: string = inputs.rawArgs.length ? inputs.rawArgs.join(' ') : '';

    const defaultConfigPath = getRepoConfigFilePath(CommandConfigKey.JestConfig, false);

    const configPath =
        args.includes('--config ') || args.includes('-c ')
            ? ''
            : `--config ${interpolationSafeWindowsPath(defaultConfigPath)}`;

    const testCommand = `${jestPath} --colors ${configPath} ${args}`;
    const results = await runVirmatorShellCommand(testCommand, inputs);

    return {
        command: testCommand,
        success: !results.error,
    };
}
