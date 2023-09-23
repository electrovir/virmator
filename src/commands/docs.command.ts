import {join} from 'path';
import type {TypeDocOptions} from 'typedoc';
import {Configuration} from 'typedoc';
import {CommandLogTransforms} from '../api/command/command-logging';
import {defineCommand} from '../api/command/define-command';
import {NpmDepTypeEnum} from '../api/command/define-command-inputs';
import {withTypescriptConfigFile} from '../augments/typescript-config-file';
import {getNpmBinPath, virmatorConfigsDir} from '../file-paths/package-paths';

export const docsCommandDefinition = defineCommand(
    {
        commandName: 'docs',
        subCommandDescriptions: {
            check: 'Check that documentation is up-to-date.',
        },
        configFiles: {
            typedocConfig: {
                copyFromInternalPath: join(virmatorConfigsDir, 'configs', 'typedoc.config.ts'),
                copyToPathRelativeToRepoDir: join('configs', 'typedoc.config.ts'),
            },
        },
        npmDeps: [
            {
                name: 'markdown-code-example-inserter',
                type: NpmDepTypeEnum.Dev,
            },
            {
                name: 'typedoc',
                type: NpmDepTypeEnum.Dev,
            },
        ],
    } as const,
    ({commandName, packageBinName}) => {
        return {
            sections: [
                {
                    title: '',
                    content: `This also inserts code snippets into markdown files. This uses the markdown-code-example-inserter package to expand code link comments inside of markdown files to actual markdown code blocks. See that package's README for more details but the basics are that you need a comment that looks like the following in your markdown file for this to do anything: \`<!-- example-link: path/to/file.ts -->\``,
                },
                {
                    title: '',
                    content: `By default this command parses all markdown files in the repo (ignoring node_modules). Specific markdown files can be parsed by giving ${packageBinName} extra parameters.`,
                },
                {
                    title: '',
                    content: `To check if files are up-to-date (rather than actually updating them), use the "check" sub-command.`,
                },
            ],
            examples: [
                {
                    title: 'default experience (usually all you need)',
                    content: `${packageBinName} ${commandName}`,
                },
                {
                    title: 'checking if files are up-to-date',
                    content: `${packageBinName} ${commandName} check`,
                },
                {
                    title: 'override files to check to a single file',
                    content: `${packageBinName} ${commandName} only/this/one/file.md`,
                },
                {
                    title: 'override files to check to a group of files',
                    content: `${packageBinName} ${commandName} "only/this/dir/*.md"`,
                },
            ],
        };
    },
    async ({
        repoDir,
        packageDir,
        configFiles,
        filteredInputArgs,
        inputSubCommands,
        subCommands,
        packageBinName,
    }) => {
        const typedocConfigPath = join(
            repoDir,
            configFiles.typedocConfig.copyToPathRelativeToRepoDir,
        );
        return await withTypescriptConfigFile(typedocConfigPath, async (loadedConfig) => {
            const containsManualMarkdownArgs = filteredInputArgs.some((arg) =>
                arg.match(/\.md['"]?$/),
            );

            const args: string[] = containsManualMarkdownArgs
                ? filteredInputArgs
                : [`\"./**/*.md\"`];

            const isCheckingOnly = inputSubCommands.includes(subCommands.check);
            const subCommand = isCheckingOnly ? '--check' : '';
            const logTransforms: CommandLogTransforms = {
                stderr: (stderrInput) =>
                    stderrInput.replace(
                        'Run without --check to update.',
                        'Run without the "check" sub-command in order to update.',
                    ),
            };

            const options: TypeDocOptions = loadedConfig.typedocConfig;

            const checkTypeDocOptions: Partial<Pick<TypeDocOptions, 'emit'>> = isCheckingOnly
                ? {emit: Configuration.EmitStrategy.none}
                : {};

            if (
                !(await runTypeDoc(
                    {
                        ...options,
                        ...checkTypeDocOptions,
                    },
                    packageBinName,
                ))
            ) {
                return {success: false};
            }

            return {
                logTransforms,
                args: [
                    await getNpmBinPath({
                        repoDir: repoDir,
                        command: 'md-code',
                        packageDirPath: packageDir,
                    }),
                    subCommand,
                    ...args,
                ],
            };
        });
    },
);

async function runTypeDoc(
    options: Partial<TypeDocOptions>,
    packageBinName: string,
): Promise<boolean> {
    const typedoc = await import('typedoc');

    const app = await typedoc.Application.bootstrapWithPlugins(options, [
        new typedoc.TypeDocReader(),
        new typedoc.PackageJsonReader(),
        new typedoc.TSConfigReader(),
    ]);
    if (app.options.getValue('version')) {
        console.log(app.toString());
        return true;
    } else if (app.options.getValue('help')) {
        console.log(app.options.getHelp());
        return true;
    } else if (app.options.getValue('showConfig')) {
        console.log(app.options.getRawValues());
        return true;
    } else if (app.logger.hasErrors()) {
        return false;
    } else if (app.options.getValue('treatWarningsAsErrors') && app.logger.hasWarnings()) {
        return false;
    } else if (app.options.getValue('watch')) {
        throw new Error(
            `TypeDoc watch mode not supported in ${packageBinName}. Run typedoc directly.`,
        );
    }

    const project = await app.convert();

    if (!project) {
        return false;
    } else if (app.options.getValue('treatWarningsAsErrors') && app.logger.hasWarnings()) {
        return false;
    }
    const preValidationWarnCount = app.logger.warningCount;
    app.validate(project);
    const hadValidationWarnings = app.logger.warningCount !== preValidationWarnCount;

    if (app.logger.hasErrors()) {
        return false;
    } else if (
        hadValidationWarnings &&
        (app.options.getValue('treatWarningsAsErrors') ||
            app.options.getValue('treatValidationWarningsAsErrors'))
    ) {
        return false;
    } else if (app.options.getValue('emit') !== 'none') {
        const json = app.options.getValue('json');
        if (!json || app.options.isSet('out')) {
            await app.generateDocs(project, app.options.getValue('out'));
        }
        if (json) {
            await app.generateJson(project, json);
        }
        if (app.logger.hasErrors()) {
            return false;
        } else if (app.options.getValue('treatWarningsAsErrors') && app.logger.hasWarnings()) {
            return false;
        }
    }
    return true;
}
