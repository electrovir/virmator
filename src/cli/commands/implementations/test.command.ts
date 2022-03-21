import {interpolationSafeWindowsPath} from 'augment-vir/dist/node';
import {getNpmBinPath} from '../../../file-paths/virmator-repo-paths';
import {CliCommandName} from '../../cli-util/cli-command-name';
import {CliFlagName} from '../../cli-util/cli-flags';
import {runVirmatorShellCommand} from '../../cli-util/shell-command-wrapper';
import {ConfigKey} from '../../config/config-key';
import {getVirmatorConfigFilePath} from '../../config/config-paths';
import {CliCommandImplementation, CliCommandResult, CommandFunctionInput} from '../cli-command';

export const testCommandImplementation: CliCommandImplementation = {
    commandName: CliCommandName.Test,
    description: {
        sections: [
            {
                title: '',
                content: `Test all .test.ts files with jest.  By default this command tests all .test.ts files in the current directory that are not .type.test.ts files. To override this behavior, pass in a custom config file with Jest's --config. All other Jest inputs are also valid.`,
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
        ConfigKey.JestConfig,
        ConfigKey.JestSetup,
    ],
    configFlagSupport: {
        [CliFlagName.NoWriteConfig]: true,
    },
};

const jestPath = getNpmBinPath('jest');

export async function runTestCommand(inputs: CommandFunctionInput): Promise<CliCommandResult> {
    const args: string = inputs.rawArgs.length
        ? interpolationSafeWindowsPath(inputs.rawArgs.join(' '))
        : '';

    const configPath =
        args.includes('--config ') || args.includes('-c ')
            ? ''
            : `--config ${interpolationSafeWindowsPath(
                  getVirmatorConfigFilePath(ConfigKey.JestConfig, false),
              )}`;

    const testCommand = `${jestPath} ${configPath} ${args}`;
    const results = await runVirmatorShellCommand(testCommand, inputs);

    return {
        command: testCommand,
        success: !results.error,
    };
}
