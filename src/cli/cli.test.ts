import {existsSync, unlink} from 'fs-extra';
import {join} from 'path';
import {testGroup} from 'test-vir';
import {runBashCommand} from '../bash-scripting';
import {VirmatorCliCommandError} from '../errors/cli-command-error';
import {testCompilePaths, testFormatPaths, virmatorDistDir} from '../virmator-repo-paths';
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
        forceOnly?: boolean;
        expect: {stdout?: string; stderr?: string};
        cleanup?: () => string | undefined | Promise<string | undefined>;
    };

    function testCli(inputs: TestCliInput) {
        const testInput = {
            description: inputs.description,
            expect: {output: inputs.expect, cleanupResult: undefined},
            forceOnly: inputs.forceOnly,
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

                const cleanupResult = inputs.cleanup && (await inputs.cleanup());

                return {output, cleanupResult};
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
        args: [CliFlagName.NoWriteConfig, CliCommand.Format, FormatOperation.Check],
        description: 'runs format',
        expect: {
            stdout: `running format...\nAll matched files use Prettier code style!\n\n${getResultMessage(
                CliCommand.Format,
                {
                    success: true,
                },
            )}`,
        },
        cwd: testFormatPaths.validRepo,
    });

    testCli({
        args: [
            CliFlagName.NoWriteConfig,
            CliFlagName.Silent,
            CliCommand.Format,
            FormatOperation.Check,
        ],
        description: 'runs silent format',
        expect: {},
        cwd: testFormatPaths.validRepo,
    });

    testCli({
        args: [CliCommand.Compile],
        description: 'runs compile',
        expect: {
            stdout: `running compile...\n${getResultMessage(CliCommand.Compile, {success: true})}`,
        },
        cwd: testCompilePaths.validRepo,
        cleanup: async () => {
            if (!existsSync(testCompilePaths.compiledValidSourceFile)) {
                return `compile command didn't actually compile`;
            }
            await unlink(testCompilePaths.compiledValidSourceFile);
            if (existsSync(testCompilePaths.compiledValidSourceFile)) {
                return `compile command test cleanup didn't remove compiled file`;
            }

            return;
        },
    });

    testCli({
        args: [CliCommand.Help],
        description: 'runs help',
        expect: {
            stdout: `\u001b[34m virmator usage:\u001b[0m\n    [npx] virmator [--flags] command subcommand\n    \n    npx is needed when the command is run directly from the terminal\n    (not scoped within an npm script) unless the package has been globally installed\n    (which is not recommended).\n    \n    \u001b[34m available flags:\u001b[0m\n        \u001b[1m\u001b[34m --help\u001b[0m: prints a help message\n        \u001b[1m\u001b[34m --no-write-config\u001b[0m: prevents a command from overwriting its relevant config file\n            (if one exists, which they usually do)\n        \u001b[1m\u001b[34m --silent\u001b[0m: turns off most logging\n    \n    \u001b[34m available commands:\u001b[0m\n        \u001b[1m\u001b[34m compile\u001b[0m: compile typescript files\n            Pass any extra tsc flags to this command.\n            \n            examples:\n                no extra flags:\n                    virmator compile\n                one extra flag:\n                    virmator compile --noEmit\n        \u001b[1m\u001b[34m format\u001b[0m: formats source files with Prettier\n            operation commands:\n                This is optional but if provided it must come first. write is the default.\n                write: overwrites files to fix formatting.\n                check: checks the formatting, does not write to files\n            \n            file extensions:\n                If only specific file extensions should be formatted, add the \"--format-files\"\n                argument to this command. All following arguments will be treated\n                as file extensions to be formatted.\n                For example, the following command will overwrite files\n                (because write is the default operation) only if they have the \n                extension \".md\" or \".json\":\n                    virmator format --format-files md json\n                \n            Prettier flags:\n                Any other arguments encountered between the operation command (if provided)\n                and the \"--format-files\" marker are treated as extra arguments to Prettier and\n                will be passed along.\n                This defaults to just '--ignore-path .gitignore'. (Thus, by default, this command\n                will only format non-git-ignored files.)\n            \n            examples:\n                checks formatting for files:\n                    virmator format check\n                checks formatting only for .md files:\n                    virmator format check --format-files md\n                checks formatting only for .md and .json files:\n                    virmator format check --format-files md json\n                fixes formatting for files:\n                    virmator format\n                    or\n                    virmator format write\n                examples with extra Prettier flags:\n                    virmator format --ignore-path .prettierignore\n                    virmator format write  --ignore-path .prettierignore\n                    virmator format write  --ignore-path .prettierignore --format-files md json\n        \u001b[1m\u001b[34m help\u001b[0m: prints a help message\n        \u001b[1m\u001b[34m spellcheck\u001b[0m: not implemented yet\n        \u001b[1m\u001b[34m test\u001b[0m: not implemented yet\n        \u001b[1m\u001b[34m update-configs\u001b[0m: not implemented yet`,
        },
    });
});
