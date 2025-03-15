import {assertWrap, check} from '@augment-vir/assert';
import {ensureError, log as logImport, RuntimeEnv, type Logger} from '@augment-vir/common';
import {readPackageJson} from '@augment-vir/node';
import {defineVirmatorPlugin, NpmDepType, PackageType, VirmatorNoTraceError} from '@virmator/core';
import {type ChalkInstance} from 'chalk';
import mri from 'mri';
import {basename, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import type * as Typedoc from 'typedoc';

/** A virmator plugin for checking and generating documentation. */
export const virmatorDocsPlugin = defineVirmatorPlugin(
    import.meta.dirname,
    {
        name: 'Docs',
        cliCommands: {
            docs: {
                doc: {
                    sections: [
                        `
                            Generates documentation using the typedoc package and inserts code examples
                            into README files using the markdown-code-example-inserter package.
                        `,
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
                                `
                                    Checks that documentation is valid and passes all checks without
                                    generating documentation outputs.
                                `,
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
                        copyFromPath: join('configs', 'typedoc.config.share.ts'),
                        copyToPath: join('configs', 'typedoc.config.ts'),
                        env: [
                            RuntimeEnv.Node,
                            RuntimeEnv.Web,
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
                            RuntimeEnv.Node,
                            RuntimeEnv.Web,
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
                            RuntimeEnv.Node,
                            RuntimeEnv.Web,
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
        const mdFilesArg = args._.some((arg) => arg.endsWith('.md')) ? '' : "'README.md'";

        const mdCodeCommand = [
            'npx',
            'md-code',
            checkOnly ? '--check' : '',
            ...filteredArgs,
            mdFilesArg,
        ]
            .filter(check.isTruthy)
            .join(' ');

        async function runDocs(
            packageDir: string,
            packageName: string,
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
                                    'Run without the "check" sub-command to update.',
                                ),
                        },
                        includeErrorMessage: true,
                    },
                );
            } catch (caught) {
                const error = ensureError(caught);
                /** Don't error for missing files. */
                if (!error.message.toLowerCase().includes('no markdown files given')) {
                    /** Don't throw an error message here because it'll already be logged to stderr. */
                    throw new VirmatorNoTraceError();
                }
            }

            /** Run typedoc */
            const typedocVerb = checkOnly ? 'check' : 'generation';

            const packageJson = await readPackageJson(packageDir);

            if (packageJson.private) {
                log.faint(`Skipping typedoc ${typedocVerb} in private repo ${packageName}`);
                return;
            }

            // dynamic imports are not branches
            /* node:coverage ignore next 7 */
            const config = (
                await import(
                    pathToFileURL(
                        join(packageDir, configs.docs.configs.typedoc.copyToPath),
                    ).toString()
                )
            ).typeDocConfig as Typedoc.TypeDocOptions;

            await runTypedoc({
                checkOnly,
                packageDir,
                config,
                log,
            });
        }

        /**
         * Node is incorrectly reporting coverage missing from the following lines. They are all
         * called.
         */
        /* node:coverage ignore next 12 */
        if (packageType === PackageType.MonoRoot) {
            await runPerPackage(async ({color, packageCwd, packageName}) => {
                await runDocs(packageCwd, packageName, color);
                return undefined;
            });
        } else {
            await runDocs(
                cwdPackagePath,
                cwdPackageJson.name || basename(cwdPackagePath),
                undefined,
            );
        }
    },
);

/** Runs TypeDoc with a TypeScript config file just like `@virmator/docs` does. */
export async function runTypedoc({
    config,
    packageDir,
    checkOnly = false,
    log = logImport,
}: {
    /** Full typedoc options object. */
    config: Partial<Typedoc.TypeDocOptions>;
    /**
     * Path to the npm package which is running typedoc. This should be a path to a directory that
     * directly contains a `package.json` file.
     */
    packageDir: string;
    /** Set to `true` to only check current doc comments, rather than generating HTML from them. */
    checkOnly?: boolean | undefined;
    /** Optionally override the logger. */
    log?: Logger | undefined;
}) {
    // dynamic imports are not branches
    /* node:coverage ignore next */
    const typedoc = await import('typedoc');

    const combinedConfig: Partial<Typedoc.TypeDocOptions> = {
        tsconfig: join(packageDir, 'tsconfig.json'),
        ...config,
        ...(checkOnly
            ? {
                  emit: typedoc.Configuration.EmitStrategy.none,
              }
            : {}),
    };

    if (!(await runTypedocInternal(combinedConfig, typedoc, log))) {
        throw new VirmatorNoTraceError();
    }
}

async function runTypedocInternal(
    options: Partial<Typedoc.TypeDocOptions>,
    typeDoc: typeof Typedoc,
    log: Logger,
): Promise<boolean> {
    /** Lots of edge cases included in here to just make sure we fully run the typedoc API. */
    /* node:coverage disable */
    const app = await typeDoc.Application.bootstrapWithPlugins(options, [
        new typeDoc.TypeDocReader(),
        new typeDoc.PackageJsonReader(),
        new typeDoc.TSConfigReader(),
    ]);
    if (app.options.getValue('version')) {
        log.plain(app.toString());
        return true;
    } else if (app.options.getValue('help')) {
        log.plain(app.options.getHelp());
        return true;
    } else if (app.options.getValue('showConfig')) {
        log.plain(app.options.getRawValues());
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

    if (!project || (app.options.getValue('treatWarningsAsErrors') && app.logger.hasWarnings())) {
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
        const json = assertWrap.isString(app.options.getValue('json'));
        if (!json || app.options.isSet('out')) {
            await app.generateDocs(project, assertWrap.isString(app.options.getValue('out')));
        }
        if (json) {
            await app.generateJson(project, json);
        }
        if (
            app.logger.hasErrors() ||
            (app.options.getValue('treatWarningsAsErrors') && app.logger.hasWarnings())
        ) {
            return false;
        }
    }
    return true;
}
