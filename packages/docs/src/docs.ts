import {ensureError, isTruthy} from '@augment-vir/common';
import {virmatorCompilePlugin} from '@virmator/compile';
import {
    defineVirmatorPlugin,
    getNpmBinPath,
    JsModuleType,
    NpmDepType,
    PackageType,
    VirmatorEnv,
    VirmatorSilentError,
    withImportedTsFile,
} from '@virmator/core';
import mri from 'mri';
import {join} from 'node:path';
import type * as Typedoc from 'typedoc';

export const virmatorDocsPlugin = defineVirmatorPlugin(
    import.meta.dirname,
    {
        name: 'Docs',
        cliCommands: {
            docs: {
                doc: {
                    sections: [
                        {
                            content: `
                                Generates documentation using the typedoc package and inserts code examples
                                into README files using the markdown-code-example-inserter package.
                            `,
                        },
                    ],
                    examples: [
                        {
                            content: 'virmator docs',
                        },
                    ],
                },
                subCommands: {
                    check: {
                        doc: {
                            sections: [
                                {
                                    content: `
                                        Checks that documentation is valid and passes all checks without
                                        generating documentation outputs.
                                    `,
                                },
                            ],
                            examples: [
                                {
                                    content: 'virmator docs check',
                                },
                            ],
                        },
                    },
                },
                configFiles: {
                    typedoc: {
                        copyFromPath: join('configs', 'typedoc.config.ts'),
                        copyToPath: join('configs', 'typedoc.config.ts'),
                        env: [
                            VirmatorEnv.Node,
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.TopPackage,
                            PackageType.MonoPackage,
                        ],
                        required: true,
                    },
                    tsconfig: virmatorCompilePlugin.cliCommands.compile.configFiles.tsconfigPackage,
                },
                npmDeps: {
                    'markdown-code-example-inserter': {
                        type: NpmDepType.Dev,
                        env: [
                            VirmatorEnv.Node,
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.TopPackage,
                            PackageType.MonoPackage,
                            PackageType.MonoRoot,
                        ],
                    },
                    typedoc: {
                        type: NpmDepType.Dev,
                        env: [
                            VirmatorEnv.Node,
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.TopPackage,
                            PackageType.MonoPackage,
                        ],
                    },
                    /** Needed to compile the TS dep-cruiser config file. */
                    esbuild: {
                        type: NpmDepType.Dev,
                        env: [
                            VirmatorEnv.Node,
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.TopPackage,
                            PackageType.MonoPackage,
                        ],
                    },
                },
            },
        },
    },
    async ({
        cliInputs: {filteredArgs, usedCommands},
        package: {monoRepoRootPath, packageType, cwdPackagePath, cwdPackageJson},
        configs,
        log,
        runPerPackage,
        runShellCommand,
        cwd,
    }) => {
        const checkOnly: boolean = !!usedCommands.docs?.subCommands.check;

        const args = mri(filteredArgs);

        /** Run md-code. */
        const mdCodeBin = await getNpmBinPath({
            command: 'md-code',
            cwd,
        });

        const mdFilesArg = args._.some((arg) => arg.endsWith('.md')) ? '' : "'./**/*.md'";

        const mdCodeCommand = [
            mdCodeBin,
            checkOnly ? '--check' : '',
            ...filteredArgs,
            mdFilesArg,
        ]
            .filter(isTruthy)
            .join(' ');

        try {
            await runShellCommand(mdCodeCommand);
        } catch (caught) {
            const error = ensureError(caught);
            /** Don't error for missing files. */
            if (!error.message.toLowerCase().includes('no markdown files')) {
                throw error;
            }
        }

        /** Run typedoc */
        const typedocVerb = checkOnly ? 'check' : 'generation';

        if (packageType === PackageType.MonoRoot) {
            log.faint(`Skipping typedoc ${typedocVerb} in mono-repo root.`);
            return;
        } else if (cwdPackageJson.private) {
            log.faint(`Skipping typedoc ${typedocVerb} in private repo.`);
            return;
        }

        await withImportedTsFile(
            {
                inputPath: join(cwdPackagePath, configs.docs.configs.typedoc.copyFromPath),
                outputPath: join(cwdPackagePath, 'node_modules', '.virmator', 'typedoc.config.cjs'),
            },
            JsModuleType.Cjs,
            async (loadedConfig) => {
                const typedocOptions: Typedoc.TypeDocOptions = loadedConfig.typeDocConfig;

                // dynamic imports are not branches
                /* node:coverage ignore next */
                const typedoc = await import('typedoc');

                const fullTypedocOptions: Typedoc.TypeDocOptions = {
                    ...typedocOptions,
                    ...(checkOnly ? {emit: typedoc.Configuration.EmitStrategy.none} : {}),
                    tsconfig: join(cwdPackagePath, 'tsconfig.json'),
                };

                if (!(await runTypedoc(fullTypedocOptions, typedoc))) {
                    throw new VirmatorSilentError();
                }
            },
        );
    },
);

async function runTypedoc(
    options: Partial<Typedoc.TypeDocOptions>,
    typeDoc: typeof Typedoc,
): Promise<boolean> {
    /** Lots of edge cases included in here to just make sure we fully run the typedoc API. */
    /* node:coverage disable */
    const app = await typeDoc.Application.bootstrapWithPlugins(options, [
        new typeDoc.TypeDocReader(),
        new typeDoc.PackageJsonReader(),
        new typeDoc.TSConfigReader(),
    ]);
    if (app.options.getValue('version')) {
        console.info(app.toString());
        return true;
    } else if (app.options.getValue('help')) {
        console.info(app.options.getHelp);
        return true;
    } else if (app.options.getValue('showConfig')) {
        console.info(app.options.getRawValues());
        return true;
    } else if (app.logger.hasErrors()) {
        return false;
    } else if (app.options.getValue('treatWarningsAsErrors') && app.logger.hasWarnings()) {
        return false;
    } else if (app.options.getValue('watch')) {
        throw new Error(
            ';TypeDoc watch mode not supported in virmator. Run typedoc directly instead.',
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
