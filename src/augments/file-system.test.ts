import {existsSync, lstat, readFile, remove} from 'fs-extra';
import {join} from 'path';
import {testGroup} from 'test-vir';
import {createSymLink, writeFileAndDir} from './file-system';

testGroup({
    description: createSymLink.name,
    tests: (runTest) => {
        const symlinkPath = 'test-symlink';

        runTest({
            description: 'creates symlink',
            expect: [false, true, true, false],
            test: async () => {
                const results: boolean[] = [];
                results.push(existsSync(symlinkPath));
                await createSymLink(__dirname, symlinkPath);
                results.push(existsSync(symlinkPath));
                results.push((await lstat(symlinkPath)).isSymbolicLink());
                if (results[1]) {
                    await remove(symlinkPath);
                }
                results.push(existsSync(symlinkPath));
                return results;
            },
        });
    },
});

testGroup({
    description: writeFileAndDir.name,
    tests: (runTest) => {
        const paths = [
            'test-dir-long-gibberish-name',
            'test-dir-2-less-long',
            'blah-blah-file.txt',
        ] as const;
        const testOutputPath = join(...paths);
        const testFileContent = 'blah blah blah';

        runTest({
            description: 'creates output file with all directories',
            expect: [false, true, true, false],
            test: async () => {
                const results: boolean[] = [];

                results[0] = existsSync(paths[0]);

                try {
                    await writeFileAndDir(testOutputPath, testFileContent);
                    results[1] = existsSync(testOutputPath);
                    results[2] = testFileContent === (await readFile(testOutputPath)).toString();
                } catch (error) {}

                if (results[1]) {
                    await remove(paths[0]);
                }
                results[3] = existsSync(testOutputPath);

                return results;
            },
        });
    },
});
