import {testGroup} from 'test-vir';

testGroup((runTest) => {
    runTest({
        description: 'valid test',
        expect: true,
        test: () => true,
    });
});
