import {extractErrorMessage, isObject, typedHasProperty} from 'augment-vir';
import {existsSync, statSync} from 'fs';
import {readFile, writeFile} from 'fs/promises';
import {join} from 'path';
import {testExpectationsFilePath, testFilesDirPath} from './virmator-test-file-paths';

export type OutputExpect =
    | string
    | {
          type: 'regexp';
          value: string;
      };

export type TestExpectation = {
    key: string;
    exitCode: number;
    stdout: OutputExpect;
    stderr: OutputExpect;
    dir: string;
};

export function expectationToKeyPath(expectation: Pick<TestExpectation, 'key' | 'dir'>): string {
    return `"${expectation.dir}" > "${expectation.key}"`;
}

export type TestExpectations = {[testFilesDir: string]: {[testKey: string]: TestExpectation}};

export async function loadExpectations(): Promise<TestExpectations> {
    try {
        const fileContents = (await readFile(testExpectationsFilePath)).toString();
        const parsedFileContents = JSON.parse(fileContents);
        assertValidLoadExpectations(parsedFileContents);

        return parsedFileContents;
    } catch (error) {
        throw new Error(`Failed to read test expectations file: ${extractErrorMessage(error)}`);
    }
}

export async function saveExpectations(expectations: TestExpectations): Promise<void> {
    await writeFile(testExpectationsFilePath, JSON.stringify(expectations, null, 4) + '\n');
}

function assertValidLoadExpectations(input: unknown): asserts input is TestExpectations {
    if (!isObject(input)) {
        throw new Error(`load expectations should be an object but got "${input}"`);
    }

    Object.keys(input).forEach((testDirKey) => {
        const testKeysObject = (input as any)[testDirKey];
        const fullTestDirKeyPath = join(testFilesDirPath, testDirKey);
        // key should be a directory in the "test-files" dir
        if (!existsSync(fullTestDirKeyPath)) {
            throw new Error(
                `invalid key "${testDirKey}" given: "${fullTestDirKeyPath}" does not exist.`,
            );
        }
        if (!statSync(fullTestDirKeyPath).isDirectory()) {
            throw new Error(`"${fullTestDirKeyPath}" is not a directory.`);
        }

        if (!isObject(testKeysObject)) {
            throw new Error(`value in "${testDirKey}" should be an object.`);
        }

        Object.keys(testKeysObject).forEach((testKey) => {
            const keyPath = `Expectation under ${expectationToKeyPath({
                dir: testDirKey,
                key: testKey,
            })}`;
            const testExpectations = (testKeysObject as any)[testKey];
            if (!isObject(testExpectations)) {
                throw new Error(`${keyPath} was not an object.`);
            }

            // key
            if (
                !typedHasProperty(testExpectations, 'key') ||
                typeof testExpectations.key !== 'string'
            ) {
                throw new Error(`${keyPath} > key was not a string.`);
            }
            if (testExpectations.key !== testKey) {
                throw new Error(
                    `${keyPath} > key does not match its key (should be "${testKey}" but was "${testExpectations.key}").`,
                );
            }

            // exit code
            if (
                !typedHasProperty(testExpectations, 'exitCode') ||
                typeof testExpectations.exitCode !== 'number'
            ) {
                throw new Error(`${keyPath} > exitCode was not a number.`);
            }

            // dir
            if (
                !typedHasProperty(testExpectations, 'dir') ||
                typeof testExpectations.dir !== 'string'
            ) {
                throw new Error(`${keyPath} > dir was not a string.`);
            }
            if (testExpectations.dir !== testDirKey) {
                throw new Error(
                    `${keyPath} > dir does not match its test dir (should be "${testDirKey}" but was "${testExpectations.dir}").`,
                );
            }

            assertOutputProperty(keyPath, testExpectations, 'stderr');
            assertOutputProperty(keyPath, testExpectations, 'stdout');
        });
    });
}

function assertOutputProperty(keyPath: string, testExpectations: object, outputKey: string): void {
    if (!typedHasProperty(testExpectations, outputKey)) {
        throw new Error(`${keyPath} > ${outputKey} is missing.`);
    }

    const value = testExpectations[outputKey];

    if (typeof value !== 'string' && !isObject(value)) {
        throw new Error(`${keyPath} > "${outputKey}" is invalid. Got "${value}"`);
    } else if (isObject(value)) {
        if (!typedHasProperty(value, 'type') || value.type !== 'regexp') {
            throw new Error(`${keyPath} > "${outputKey}".type is invalid. Expected "regexp".`);
        }
        if (!typedHasProperty(value, 'value') || typeof value.value !== 'string') {
            throw new Error(`${keyPath} > "${outputKey}".value is invalid. Expected a string.`);
        }
    }
}
