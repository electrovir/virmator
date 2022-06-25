import {ArrayElement, getObjectTypedKeys} from 'augment-vir';
import {
    interpolationSafeWindowsPath,
    runShellCommand,
    ShellOutput,
} from 'augment-vir/dist/cjs/node-only';
import {assert} from 'chai';
import {join} from 'path';
import {virmatorDistDir} from '../file-paths/virmator-package-paths';
import {CliCommandDefinition} from './cli-command/define-cli-command';

const cliPath = join(virmatorDistDir, 'cli', 'cli.js');

type RunCliCommandInputs<T extends CliCommandDefinition> = {
    commandDefinition: T;
    subCommand?: ArrayElement<T['allAvailableSubCommands']> | undefined;
    extraArgs?: string[];
    cwd: string;
};

export async function runCliCommandForTest<T extends CliCommandDefinition>(
    inputs: RunCliCommandInputs<T>,
    expectations?: Partial<ShellOutput>,
    message: string = '',
) {
    const cliCommand = interpolationSafeWindowsPath(cliPath);
    const subCommand = inputs.subCommand ?? '';
    const extraArgs = inputs.extraArgs?.join(' ') ?? '';
    const commandString = `node ${cliCommand} ${inputs.commandDefinition.commandName} ${subCommand} ${extraArgs}`;

    const results = await runShellCommand(commandString, {cwd: inputs.cwd});

    if (expectations) {
        getObjectTypedKeys(expectations).forEach((expectationKey) => {
            // this is logged separately so that special characters (like color codes) are visible
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
