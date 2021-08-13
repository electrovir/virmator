import {testGroup} from 'test-vir';
import {interpolationSafeWindowsPath, toPosixPath} from './string';

testGroup({
    description: toPosixPath.name,
    tests: (runTest) => {
        runTest({
            description: 'with drive letter',
            expect: '/d/a/virmator/virmator/dist\n',
            test: () => {
                return toPosixPath('D:\\a\\virmator\\virmator\\dist\n');
            },
        });

        runTest({
            description: 'with double escaped path',
            expect: '/d/a/virmator/virmator/dist\n',
            test: () => {
                return toPosixPath('D:\\\\a\\\\virmator\\\\virmator\\\\dist\n');
            },
        });
    },
});

testGroup({
    description: interpolationSafeWindowsPath.name,
    tests: (runTest) => {
        runTest({
            description: 'with drive letter',
            expect: 'D:\\\\\\\\a\\\\\\\\virmator\\\\\\\\virmator\\\\\\\\dist\n',
            test: () => {
                return interpolationSafeWindowsPath('D:\\a\\virmator\\virmator\\dist\n');
            },
        });
    },
});
