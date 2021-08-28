import {join} from 'path';
import {testGroup} from 'test-vir';

testGroup((runTest) => {
    runTest({
        expect: join('dir1', 'dir2', 'dir4'),
        test: () => {
            return join('dir1', 'dir2', 'dir3', '..', 'dir4');
        },
    });
});
