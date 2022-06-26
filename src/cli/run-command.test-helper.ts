import {ArrayElement, combineErrors, extractErrorMessage, getObjectTypedKeys} from 'augment-vir';
import {
    interpolationSafeWindowsPath,
    runShellCommand,
    ShellOutput,
} from 'augment-vir/dist/cjs/node-only';
import {assert} from 'chai';
import {readdir} from 'fs/promises';
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

    const beforeTestFiles = (await readdir(inputs.cwd)).sort();
    const results = await runShellCommand(commandString, {cwd: inputs.cwd});
    const afterTestFiles = (await readdir(inputs.cwd)).sort();
    const newFiles = afterTestFiles.filter((afterFile) => !beforeTestFiles.includes(afterFile));

    if (expectations) {
        const errors: Error[] = [];
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
            try {
                assert.strictEqual(
                    results[expectationKey],
                    expectations[expectationKey],
                    `\n${mismatch}\n`,
                );
            } catch (error) {
                errors.push(new Error(extractErrorMessage(error)));
            }
        });
        if (errors.length) {
            throw combineErrors(errors);
        }
    }

    return {
        results,
        beforeTestFiles,
        afterTestFiles,
        newFiles,
    };
}
