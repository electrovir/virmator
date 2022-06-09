import {ArrayElement, getObjectTypedKeys} from 'augment-vir';
import {
    interpolationSafeWindowsPath,
    runShellCommand,
    ShellOutput,
} from 'augment-vir/dist/cjs/node-only';
import {assert} from 'chai';
import {join} from 'path';
import {virmatorDistDir} from '../file-paths/virmator-repo-paths';
import {allCliCommandDefinitions} from './all-cli-command-definitions';
import {CliCommandName} from './cli-command/cli-command-name';

const cliPath = join(virmatorDistDir, 'cli', 'cli.js');

type RunCliCommandInputs<T extends CliCommandName> = {
    commandName: T;
    subCommand?:
        | ArrayElement<typeof allCliCommandDefinitions[T]['availableSubCommands']>
        | undefined;
    extraArgs?: string[];
    cwd: string;
};

export async function runCliCommandForTest<T extends CliCommandName>(
    inputs: RunCliCommandInputs<T>,
    expectations?: Partial<ShellOutput>,
    message: string = '',
) {
    const cliCommand = interpolationSafeWindowsPath(cliPath);
    const subCommand = inputs.subCommand ?? '';
    const extraArgs = inputs.extraArgs?.join(' ') ?? '';
    const commandString = `node ${cliCommand} ${inputs.commandName} ${subCommand} ${extraArgs}`;

    const results = await runShellCommand(commandString, {cwd: inputs.cwd});

    if (expectations) {
        getObjectTypedKeys(expectations).forEach((expectationKey) => {
            const mismatch = JSON.stringify(
                {
                    [`${message}${message ? '-' : ''}actual-${expectationKey}`]:
                        results[expectationKey],
                    [`${message}${message ? '-' : ''}expected-${expectationKey}`]:
                        expectations[expectationKey],
                },
                null,
                4,
            );
            assert.strictEqual(results[expectationKey], expectations[expectationKey], mismatch);
        });
    }

    return results;
}
