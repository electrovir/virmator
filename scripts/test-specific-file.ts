import {runBashCommand} from 'augment-vir/dist/node';
import {existsSync} from 'fs-extra';
import {extname, join} from 'path';

async function main() {
    const testFileInput =
        process.argv[1] === __filename
            ? // argv[2] is for when this script is called through ts-node or node
              process.argv[2]
            : // argv[1] is used when this script is called directly
              process.argv[1];

    if (!testFileInput) {
        throw new Error(`No test file was given.`);
    }

    const isTsFile = extname(testFileInput) === '.ts';

    const jsTestFile = isTsFile
        ? testFileInput.replace(/\.ts$/, '.js').replace(/(?:\.\/|^)src\//, '')
        : testFileInput;
    const distTestFile = join('dist', jsTestFile);

    const fileToTest = existsSync(jsTestFile) ? jsTestFile : distTestFile;

    if (!existsSync(fileToTest)) {
        if (isTsFile) {
            throw new Error(`Could not find test file for "${testFileInput}"`);
        } else {
            throw new Error(`Could not find test file "${testFileInput}"`);
        }
    }

    const testOutput = await runBashCommand(`node dist/cli/cli.js test ${fileToTest}`);
    console.info(testOutput.stdout);
    console.error(testOutput.stderr);

    if (testOutput.error) {
        process.exit(1);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
