import {ensureError, isTruthy} from '@augment-vir/common';
import {
    defineVirmatorPlugin,
    JsModuleType,
    NpmDepType,
    PackageType,
    VirmatorEnv,
    VirmatorSilentError,
    withImportedTsFile,
} from '@virmator/core';
import {ChalkInstance} from 'chalk';
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
        package: {packageType, cwdPackagePath, cwdPackageJson},
        configs,
        log,
        runPerPackage,
        runShellCommand,
    }) => {
        const checkOnly: boolean = !!usedCommands.docs?.subCommands.check;

        const args = mri(filteredArgs);

        /** Run md-code. */
        const mdFilesArg = args._.some((arg) => arg.endsWith('.md')) ? '' : "'./**/*.md'";

        const mdCodeCommand = [
            'npx',
            'md-code',
            checkOnly ? '--check' : '',
            ...filteredArgs,
            mdFilesArg,
        ]
            .filter(isTruthy)
            .join(' ');

        async function runDocs(
            packageDir: string,
            packageName: string | undefined,
            color: ChalkInstance | undefined,
        ) {
            try {
                await runShellCommand(
                    mdCodeCommand,
                    {cwd: packageDir},
                    {
                        logPrefix: color && packageName ? color(`[${packageName}] `) : undefined,
                        logTransform: {
                            stderr: (stderrInput) =>
                                stderrInput.replace(
                                    'Run without --check to update.',
                                    'Run without the "check" sub-command in order to update.',
                                ),
                        },
                    },
                );
            } catch (caught) {
                const error = ensureError(caught);
                /** Don't error for missing files. */
                if (!error.message.toLowerCase().includes('no markdown files')) {
                    throw error;
                }
            }

            /** Run typedoc */
            const typedocVerb = checkOnly ? 'check' : 'generation';

            if (packageType !== PackageType.MonoRoot && cwdPackageJson.private) {
                log.faint(`Skipping typedoc ${typedocVerb} in private repo.`);
                return;
            }

            await withImportedTsFile(
                {
                    inputPath: join(packageDir, configs.docs.configs.typedoc.copyFromPath),
                    outputPath: join(packageDir, 'node_modules', '.virmator', 'typedoc.config.cjs'),
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
                        tsconfig: join(packageDir, 'tsconfig.json'),
                    };

                    if (!(await runTypedoc(fullTypedocOptions, typedoc))) {
                        throw new VirmatorSilentError();
                    }
                },
            );
        }

        if (packageType === PackageType.MonoRoot) {
            await runPerPackage(async ({color, packageCwd, packageName}) => {
                await runDocs(packageCwd, packageName, color);
                return undefined;
            });
        } else {
            await runDocs(cwdPackagePath, undefined, undefined);
        }
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
