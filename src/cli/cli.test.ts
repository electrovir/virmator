import {join} from 'path';
import {testGroup} from 'test-vir';
import {runBashCommand} from '../bash-scripting';
import {VirmatorCliCommandError} from '../errors/cli-command-error';
import {testFormatPaths, virmatorDistDir} from '../virmator-repo-paths';
import {CliFlagName} from './cli-util/cli-flags';
import {cliErrorMessages, getResultMessage} from './cli-util/cli-messages';
import {CliCommand} from './commands/cli-command';
import {FormatOperation} from './commands/format';

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

    testCli({
        args: [CliCommand.Help],
        description: 'runs help',
        expect: {
            stdout: '\u001b[34m virmator usage:\u001b[0m\n    [npx] virmator [--flags] command subcommand\n    \n    npx is needed when the command is run directly from the terminal\n    (not scoped within an npm script) unless the package has been globally installed\n    (which is not recommended).\n    \n    \u001b[34m available flags:\u001b[0m\n        \u001b[1m\u001b[34m --silent\u001b[0m: turns off most logging\n        \u001b[1m\u001b[34m --no-write-config\u001b[0m: prevents a command from overwriting its relevant config file\n            (if one exists, which they usually do)\n        \u001b[1m\u001b[34m --help\u001b[0m: prints a help message\n    \n    \u001b[34m available commands:\u001b[0m\n        \u001b[1m\u001b[34m format\u001b[0m: formats source files with Prettier\n            sub commands:\n                write: overwrites files to fix formatting. This is the default operation.\n                check: checks the formatting, does not write to files\n                Any other arguments are treated as a list of file extensions to format.\n                    The default list of file extensions is the following:\n                        ts, json, html, css, md, js, yml, yaml\n                    For example, the following command will overwrite files\n                    (because write is the default operation) only if they have the \n                    extension ".md" or ".json":\n                        virmator format md json\n            \n            examples:\n                checks formatting for files\n                    virmator format check\n                checks formatting only for .md files\n                    virmator format check md\n                checks formatting only for .md and .json files\n                    virmator format check md json\n                fixes formatting for files\n                    virmator format\n                    or\n                    virmator format write\n        \u001b[1m\u001b[34m spellcheck\u001b[0m: not implemented yet\n        \u001b[1m\u001b[34m test\u001b[0m: not implemented yet\n        \u001b[1m\u001b[34m help\u001b[0m: prints a help message\n        \u001b[1m\u001b[34m update-configs\u001b[0m: not implemented yet',
        },
    });
});
