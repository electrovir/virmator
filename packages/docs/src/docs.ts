import {assertWrap, check} from '@augment-vir/assert';
import {
    ensureError,
    log as logImport,
    RuntimeEnv,
    type AnyObject,
    type Logger,
} from '@augment-vir/common';
import {readPackageJson} from '@augment-vir/node';
import {defineVirmatorPlugin, NpmDepType, PackageType, VirmatorNoTraceError} from '@virmator/core';
import mri from 'mri';
import {basename, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createCommandLogPrefix, type ColorKey} from 'runstorm';
import type * as Typedoc from 'typedoc';

/**
 * A virmator plugin for checking and generating documentation.
 *
 * @category Main
 */
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
                        env: {
                            [RuntimeEnv.Node]: true,
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.TopPackage]: true,
                            [PackageType.MonoPackage]: true,
                        },
                        required: true,
                        skipPrivatePackages: true,
                    },
                },
                npmDeps: {
                    'markdown-code-example-inserter': {
                        type: NpmDepType.Dev,
                        env: {
                            [RuntimeEnv.Node]: true,
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.TopPackage]: true,
                            [PackageType.MonoPackage]: true,
                            [PackageType.MonoRoot]: true,
                        },
                    },
                    typedoc: {
                        type: NpmDepType.Dev,
                        env: {
                            [RuntimeEnv.Node]: true,
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.TopPackage]: true,
                            [PackageType.MonoPackage]: true,
                        },
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

        async function runDocs({
            packageDir,
            packageName,
            color,
        }: Readonly<{packageDir: string; packageName: string; color: ColorKey | undefined}>) {
            const packageJson = await readPackageJson(packageDir);

            /** Private packages are never published, so they are never documented either. */
            if (packageJson.private) {
                log.faint(`Skipping docs in private package ${packageName}`);
                return;
            }

            try {
                await runShellCommand(
                    mdCodeCommand,
                    {
                        cwd: packageDir,
                    },
                    {
                        logPrefix:
                            color && packageName
                                ? createCommandLogPrefix({
                                      name: packageName,
                                      color,
                                  })
                                : undefined,
                        logTransform: {
                            stderr: (stderrInput) => {
                                return stderrInput.replace(
                                    'Run without --check to update.',
                                    'Run without the "check" sub-command to update.',
                                );
                            },
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
            // dynamic imports are not branches
            /* node:coverage ignore next 7 */
            const config = (
                await import(
                    pathToFileURL(
                        join(packageDir, configs.docs.configs.typedoc.copyToPath),
                    ).toString()
                )
            ).typeDocConfig as Partial<Typedoc.TypeDocOptions>;

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
                await runDocs({
                    packageDir: packageCwd,
                    packageName,
                    color,
                });
                return undefined;
            });
        } else {
            await runDocs({
                packageDir: cwdPackagePath,
                packageName: cwdPackageJson.name || basename(cwdPackagePath),
                color: undefined,
            });
        }
    },
);

/**
 * Runs TypeDoc with a TypeScript config file just like `@virmator/docs` does.
 *
 * @category Main
 */
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

    const combinedConfig = {
        tsconfig: join(packageDir, 'tsconfig.json'),
        ...config,
        ...(checkOnly
            ? {
                  emit: typedoc.Configuration.EmitStrategy.none,
              }
            : {}),
    } as AnyObject as Partial<Typedoc.TypeDocOptions>;

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
    app.on(typeDoc.Application.EVENT_VALIDATE_PROJECT, (project) => {
        validatePublicExportCategories({
            app,
            project,
            typeDoc,
        });
    });
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
            'TypeDoc watch mode not supported in virmator. Run typedoc directly instead.',
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

function validatePublicExportCategories({
    app,
    project,
    typeDoc,
}: Readonly<{
    app: Typedoc.Application;
    project: Typedoc.ProjectReflection;
    typeDoc: typeof Typedoc;
}>) {
    (project.children || [])
        .filter((reflection) => {
            return ![
                reflection.comment,
                ...reflection.getNonIndexSignatures().map((signature) => {
                    return signature.comment;
                }),
            ].some((comment) => {
                return comment?.getTags('@category').some((tag) => {
                    return typeDoc.Comment.combineDisplayParts(tag.content).trim().length;
                });
            });
        })
        .forEach((reflection) => {
            app.logger.validationWarning(
                `Export '${reflection.getFriendlyFullName()}' is missing a non-empty @category tag.`,
            );
        });
}
