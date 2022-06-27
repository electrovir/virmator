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
import {readdir, readFile, stat} from 'fs/promises';
import {join} from 'path';
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
    const dirFileContentsBefore = await readFileContents(inputs.cwd);
    const results = await runShellCommand(commandString, {
        cwd: inputs.cwd,
        ...(inputs.debug
            ? {
                  hookUpToConsole: true,
              }
            : // ? {
              //       stderrCallback(stderr) {
              //           console.error({stderr});
              //           console.error(stderr);
              //       },
              //       stdoutCallback(stdout) {
              //           console.error({stdout});
              //           console.error(stdout);
              //       },
              //   }
              {}),
    });
    const dirFileNamesAfter = (await readdir(inputs.cwd)).sort();
    const dirFileContentsAfter = await readFileContents(inputs.cwd);

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
                errors.push(new Error(extractErrorMessage(error)));
            }
        });
        if (errors.length) {
            throw combineErrors(errors);
        }
    }

    return {
        results,
        dirFileNamesBefore,
        dirFileNamesAfter,
        dirFileContentsBefore,
        dirFileContentsAfter,
        changedFiles,
        newFiles,
    };
}

async function readFileContents(dir: string): Promise<Record<string, string>> {
    const fileNames = await readdir(dir);
    const allFileContents = await Promise.all(
        fileNames.map(async (fileName) => {
            const filePath = join(dir, fileName);
            const isFile = (await stat(filePath)).isFile();
            return isFile ? (await readFile(filePath)).toString() : '';
        }),
    );

    const mappedFileContents = fileNames.reduce((accum, fileName, index) => {
        const fileContents = allFileContents[index] ?? '';
        accum[fileName] = fileContents;
        return accum;
    }, {} as Record<string, string>);

    return mappedFileContents;
}
