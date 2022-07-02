import {
    ArrayElement,
    combineErrors,
    extractErrorMessage,
    getObjectTypedKeys,
    Overwrite,
} from 'augment-vir';
import {
    interpolationSafeWindowsPath,
    runShellCommand,
    ShellOutput,
} from 'augment-vir/dist/cjs/node-only';
import {assert} from 'chai';
import {readdir} from 'fs/promises';
import {join} from 'path';
import {readAllDirContents} from '../augments/fs';
import {filterObject} from '../augments/object';
import {virmatorDistDir} from '../file-paths/virmator-package-paths';
import {CliCommandDefinition} from './cli-command/define-cli-command';

const cliPath = join(virmatorDistDir, 'cli', 'cli.js');

type RunCliCommandInputs<T extends CliCommandDefinition> = {
    commandDefinition: T;
    subCommand?: ArrayElement<T['allAvailableSubCommands']> | undefined;
    extraArgs?: string[];
    cwd: string;
    debug?: boolean;
    filesShouldNotChange?: boolean;
};

export async function runCliCommandForTest<T extends CliCommandDefinition>(
    inputs: RunCliCommandInputs<T>,
    expectations?: Omit<
        Overwrite<ShellOutput, {stderr: string | RegExp; stdout: string | RegExp}>,
        'error'
    >,
    message: string = '',
) {
    const cliCommand = interpolationSafeWindowsPath(cliPath);
    const subCommand = inputs.subCommand ?? '';
    const extraArgs = inputs.extraArgs?.join(' ') ?? '';
    const commandString = `node ${cliCommand} ${inputs.commandDefinition.commandName} ${subCommand} ${extraArgs}`;

    const dirFileNamesBefore = (await readdir(inputs.cwd)).sort();
    const dirFileContentsBefore = await readAllDirContents(inputs.cwd);
    const beforeTimestamp: number = Date.now();
    const results = await runShellCommand(commandString, {
        cwd: inputs.cwd,
        ...(inputs.debug
            ? {
                  hookUpToConsole: true,
              }
            : {}),
    });
    const afterTimestamp: number = Date.now();

    const durationMs: number = afterTimestamp - beforeTimestamp;

    const dirFileNamesAfter = (await readdir(inputs.cwd)).sort();
    const dirFileContentsAfter = await readAllDirContents(inputs.cwd);

    const newFiles = dirFileNamesAfter.filter(
        (afterFile) => !dirFileNamesBefore.includes(afterFile),
    );
    const changedFiles = filterObject(dirFileContentsAfter, (afterContents, key) => {
        const beforeContents = dirFileContentsBefore[key];

        return beforeContents !== afterContents;
    });

    if (expectations) {
        const errors: Error[] = [];
        getObjectTypedKeys(expectations).forEach((expectationKey) => {
            const expectation = expectations[expectationKey];
            const result = results[expectationKey];

            const expectationMessage =
                expectation instanceof RegExp ? String(expectation) : expectation;
            // this is logged separately so that special characters (like color codes) are visible
            const mismatch = JSON.stringify(
                {
                    [`${message}${message ? '-' : ''}actual-${expectationKey}`]: result,
                    [`${message}${message ? '-' : ''}expected-${expectationKey}`]:
                        expectationMessage,
                },
                null,
                4,
            );

            const mismatchMessage = `\n${mismatch}\n`;
            try {
                if (expectation instanceof RegExp) {
                    assert.match(String(result), expectation, mismatchMessage);
                } else {
                    assert.strictEqual(result, expectation, mismatchMessage);
                }
            } catch (error) {
                if (expectation instanceof RegExp) {
                    console.log(expectation, {expectation}, String(expectation));
                }
                console.info(result);
                errors.push(new Error(extractErrorMessage(error)));
            }
        });
        if (errors.length) {
            throw combineErrors(errors);
        }
    }

    if (inputs.filesShouldNotChange) {
        assert.deepEqual(
            dirFileNamesBefore,
            dirFileNamesAfter,
            'new files should not have been generated',
        );
        assert.deepEqual(
            dirFileContentsBefore,
            dirFileContentsAfter,
            'file contents should not have changed',
        );
    }

    return {
        results,
        dirFileNamesBefore,
        dirFileNamesAfter,
        dirFileContentsBefore,
        dirFileContentsAfter,
        changedFiles,
        newFiles,
        durationMs,
    };
}
