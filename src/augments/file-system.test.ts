import {existsSync} from 'fs';
import {lstat, unlink} from 'fs-extra';
import {testGroup} from 'test-vir';
import {createSymLink} from './file-system';

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
                    await unlink(symlinkPath);
                }
                results.push(existsSync(symlinkPath));
                return results;
            },
        });
    },
});
