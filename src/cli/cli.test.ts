import {join} from 'path';
import {testGroup} from 'test-vir';
import {runBashCommand} from '../bash-scripting';
import {VirmatorCliCommandError} from '../errors/cli-command-error';
import {testFormatPaths, virmatorDistDir} from '../virmator-repo-paths';
import {CliCommand} from './cli-command';
import {cliErrorMessages, getResultMessage} from './cli-messages';
import {FormatOperation} from './command-functions/format/format';
import {CliFlagName} from './flags';

const cliPath = join(virmatorDistDir, 'cli', 'cli.js');

testGroup((runTest) => {
    type TestCliInput = {
        args: string[];
        description: string;
        debug?: boolean;
        cwd?: string;
        expect: {stdout?: string; stderr?: string};
    };

    function testCli(inputs: TestCliInput) {
        const testInput = {
            description: inputs.description,
            expect: inputs.expect,
            test: async () => {
                const results = await runBashCommand(
                    `node ${cliPath} ${inputs.args.join(' ')}`,
                    inputs.cwd,
                );

                if (inputs.debug) {
                    console.log('stdout:');
                    console.log(results.stdout);
                    console.log('stderr:');
                    console.error(results.stderr);
                }

                const output: any = {
                    stdout: results.stdout.trim() || undefined,
                    stderr: results.stderr.trim() || undefined,
                };

                Object.keys(output).forEach((key) => {
                    if (output[key] == undefined) {
                        delete output[key];
                    }
                });

                return output;
            },
        };

        runTest(testInput);
    }

    testCli({
        args: [],
        description: 'fails when no commands are given',
        expect: {stderr: String(new VirmatorCliCommandError(cliErrorMessages.missingCliCommand))},
    });

    const invalidCommand = 'eat-pie';

    testCli({
        args: [invalidCommand],
        description: 'fails when invalid commands are given',
        expect: {
            stderr: String(
                new VirmatorCliCommandError(cliErrorMessages.invalidCliCommand(invalidCommand)),
            ),
        },
    });

    testCli({
        args: [CliCommand.Format, FormatOperation.Check, CliFlagName.NoWriteConfig],
        description: 'runs format',
        expect: {
            stdout: `Running format...\n${getResultMessage(CliCommand.Format, {success: true})}`,
            stderr: 'Checking formatting...\nAll matched files use Prettier code style!',
        },
        cwd: testFormatPaths.validRepo,
    });
});
