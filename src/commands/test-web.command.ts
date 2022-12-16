import {runShellCommand} from '@augment-vir/node-js';
import {TestRunnerConfig} from '@web/test-runner';
import {writeFile} from 'fs/promises';
import glob from 'glob-promise';
import {basename, join, relative} from 'path';
import {defineCommand} from '../api/command/define-command';
import {jsonParseOrUndefined} from '../augments/json';
import {getNpmBinPath, virmatorConfigsDir} from '../file-paths/package-paths';
import {testCommandDefinition} from './test.command';

const allFilesTestFileName = 'all-files-for-code-coverage.test.ts';

export const testWebCommandDefinition = defineCommand(
    {
        commandName: 'test-web',
        subCommandDescriptions: {},
        configFiles: {
            webTestRunner: {
                copyFromInternalPath: join(
                    virmatorConfigsDir,
                    'configs',
                    'web-test-runner.config.mjs',
                ),
                copyToPathRelativeToRepoDir: join('configs', 'web-test-runner.config.mjs'),
            },
        },
        npmDeps: [
            '@open-wc/testing',
            '@types/mocha',
            '@web/dev-server-esbuild',
            '@web/test-runner-commands',
            '@web/test-runner-playwright',
            '@web/test-runner',
        ],
    } as const,
    ({commandName, packageBinName, configFiles}) => {
        return {
            sections: [
                {
                    title: '',
                    content: `Runs tests within browsers rather than inside of Node.js. Test files fed into this command cannot be mixed with test files run by the "${packageBinName} ${
                        testCommandDefinition.commandName
                    }" command, as the run-time environment is quite different (Node.js vs browser). However, just like the ${
                        testCommandDefinition.commandName
                    } command, this command will all ".test.ts" files in the current directory (recursively) that are not ".type.test.ts" files. To override this behavior, override the "files" property in ${basename(
                        configFiles.webTestRunner.copyFromInternalPath,
                    )}.`,
                },
                {
                    title: '',
                    content: `By default this command runs all tests three times: in Chromium (Chrome), Firefox, and Webkit (Safari) using playwright.`,
                },
            ],

            examples: [
                {
                    title: 'Test all .test.ts and .test.tsx files',
                    content: `${packageBinName} ${commandName}`,
                },
                {
                    title: 'Test a specific file',
                    content: `${packageBinName} ${commandName} path/to/file.test.ts`,
                },
            ],
        };
    },
    async (inputs) => {
        const configFlagIndex = inputs.filteredInputArgs.indexOf('--config');
        const shouldUseDefaultConfig = configFlagIndex === -1;
        const configPath = shouldUseDefaultConfig
            ? inputs.configFiles.webTestRunner.copyToPathRelativeToRepoDir
            : inputs.filteredInputArgs[configFlagIndex + 1] ||
              inputs.configFiles.webTestRunner.copyToPathRelativeToRepoDir;
        const configString = shouldUseDefaultConfig ? `--config ${configPath}` : '';

        const output = await runShellCommand(`node ${relative(inputs.repoDir, configPath)}`, {
            cwd: inputs.repoDir,
        });

        const webTestRunnerConfig: Partial<TestRunnerConfig> | undefined = jsonParseOrUndefined(
            output.stdout,
        );

        if (webTestRunnerConfig && webTestRunnerConfig.coverage) {
            await createTestThatImportsAllFilesForCoverage(webTestRunnerConfig, inputs.repoDir);
        }

        return {
            mainCommand: await getNpmBinPath({
                repoDir: inputs.repoDir,
                command: 'web-test-runner',
                packageDirPath: inputs.packageDir,
            }),
            args: [
                '--color',
                configString,
                ...inputs.filteredInputArgs,
            ],
        };
    },
);

async function createTestThatImportsAllFilesForCoverage(
    webTestRunnerConfig: Partial<TestRunnerConfig>,
    repoDir: string,
) {
    const coverageInclude = webTestRunnerConfig?.coverageConfig?.include;
    const filesToIncludeInCoverage = coverageInclude
        ? Array.isArray(coverageInclude)
            ? coverageInclude
            : [coverageInclude]
        : [];

    const allCoverageFiles = Array.from(
        new Set(
            (
                await Promise.all(
                    filesToIncludeInCoverage.map((pattern) =>
                        glob(pattern, {
                            cwd: repoDir,
                            ignore: [
                                ...(webTestRunnerConfig?.coverageConfig?.exclude ?? []),
                                allFilesTestFileName,
                            ],
                        }),
                    ),
                )
            )
                .flat()
                .sort(),
        ),
    );

    if (allCoverageFiles.length) {
        const importNames: string[] = [];
        const allImports = allCoverageFiles
            .map((file, index) => {
                const importName = `import${index}`;
                importNames.push(importName);
                return `import * as ${importName} from './${relative('src', file).replace(
                    /\.ts$/,
                    '',
                )}';`;
            })
            .join('\n');
        const usedImports = importNames.map((importName) => `    ${importName},`);
        const codeToWrite = `// this file is generated by virmator for code coverage calculations in the test-web command\n${allImports}\n\n// this is just here to make sure the imports don't get removed for not being used\nconst allImports = {\n${usedImports.join(
            '\n',
        )}\n};\n`;
        await writeFile(join(repoDir, 'src', allFilesTestFileName), codeToWrite);
    } else {
        throw new Error(`No files found for code coverage calculations.`);
    }
}
