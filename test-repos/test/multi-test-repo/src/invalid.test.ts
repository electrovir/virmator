import {testGroup} from 'test-vir';

testGroup((runTest) => {
    runTest({
        description: 'invalid test',
        expect: true,
        test: () => false,
    });
});
