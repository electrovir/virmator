import {join} from 'path';
import {testGroup} from 'test-vir';
import {runBashCommand} from '../bash-scripting';
import {VirmatorCliCommandError} from '../errors/cli-command-error';
import {distDir} from '../global-repo-paths';
import {cliErrorMessages} from './cli-messages';

const cliPath = join(distDir, 'cli', 'cli.js');

testGroup((runTest) => {
    type TestCliInput = {
        args: string[];
        description: string;
    } & ({expectOut: string} | {expectErr: string});

    function testCli(inputs: TestCliInput) {
        const testInput = {
            description: inputs.description,
            expect: 'expectOut' in inputs ? inputs.expectOut : inputs.expectErr,
            test: async () => {
                const results = await runBashCommand(`node ${cliPath} ${inputs.args.join(' ')}`);

                if ('expectOut' in inputs) {
                    return results.stdout.trim();
                } else {
                    return results.stderr.trim();
                }
            },
        };

        runTest(testInput);
    }

    testCli({
        args: [],
        description: 'fails when no commands are given',
        expectErr: String(new VirmatorCliCommandError(cliErrorMessages.missingCliCommand)),
    });

    const invalidCommand = 'eat-pie';

    testCli({
        args: [invalidCommand],
        description: 'fails when invalid commands are given',
        expectErr: String(
            new VirmatorCliCommandError(cliErrorMessages.invalidCliCommand(invalidCommand)),
        ),
    });
});
