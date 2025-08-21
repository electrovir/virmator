import {check} from '@augment-vir/assert';
import {type MaybePromise, RuntimeEnv} from '@augment-vir/common';
import {toPosixPath} from '@augment-vir/node';
import {defineVirmatorPlugin, NpmDepType, PackageType} from '@virmator/core';
import mri from 'mri';
import {cp, rm} from 'node:fs/promises';
import {join, relative, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {type UserConfig} from 'vite';

/** A virmator plugin for running and building frontend packages. */
export const virmatorFrontendPlugin = defineVirmatorPlugin(
    import.meta.dirname,
    {
        name: 'Frontend',
        cliCommands: {
            frontend: {
                doc: {
                    sections: [
                        `
                            Runs a frontend dev server with Vite.
                        `,
                    ],
                    examples: [
                        {
                            content: 'virmator frontend',
                        },
                    ],
                },
                subCommands: {
                    build: {
                        doc: {
                            sections: [
                                `
                                    Builds a frontend for deployment using Vite (and Rollup).
                                `,
                            ],
                            examples: [
                                {
                                    content: 'virmator frontend build',
                                },
                            ],
                        },
                    },
                    preview: {
                        doc: {
                            sections: [
                                `
                                    Builds a frontend and previews that build in a local dev server.
                                `,
                            ],
                            examples: [
                                {
                                    content: 'virmator frontend preview',
                                },
                            ],
                        },
                    },
                },
                configFiles: {
                    vite: {
                        copyFromPath: join('configs', 'vite.config.ts'),
                        copyToPath: join('configs', 'vite.config.ts'),
                        env: {
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.TopPackage]: true,
                            [PackageType.MonoPackage]: true,
                        },
                        required: true,
                        configFlags: ['--config'],
                    },
                },
                npmDeps: {
                    typescript: {
                        type: NpmDepType.Dev,
                        env: {
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.MonoPackage]: true,
                            [PackageType.TopPackage]: true,
                        },
                    },
                    vite: {
                        type: NpmDepType.Dev,
                        env: {
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.MonoPackage]: true,
                            [PackageType.TopPackage]: true,
                        },
                    },
                },
            },
        },
    },
    async ({
        cliInputs: {filteredArgs, usedCommands},
        package: {cwdPackagePath},
        runShellCommand,
        cwd,
        configs,
        log,
    }) => {
        const args = mri(filteredArgs);

        const needsBuild =
            usedCommands.frontend?.subCommands.build || usedCommands.frontend?.subCommands.preview;
        const configPath = args.config || configs.frontend.configs.vite.fullCopyToPath;

        const viteConfig = await ((
            await import(pathToFileURL(configPath).toString())
        ).default as MaybePromise<UserConfig>);

        const rootDir: string = viteConfig.root ? resolve(cwd, viteConfig.root) : cwd;
        const outDir: string = resolve(rootDir, viteConfig.build?.outDir || 'dist');

        const configArgs = args.config
            ? []
            : [
                  '--config',
                  toPosixPath(relative(cwd, configPath)),
              ];

        const baseViteCommands = [
            /** Required so that .ts vite configs can import other .ts files. */
            'NODE_OPTIONS="--import tsx"',
            'npx',
            'vite',
        ];

        if (needsBuild) {
            await rm(join(cwdPackagePath, 'node_modules', '.vite'), {force: true, recursive: true});

            await rm(outDir, {recursive: true, force: true});

            const buildCommand = [
                ...baseViteCommands,
                'build',
                ...filteredArgs,
                ...configArgs,
            ]
                .filter(check.isTruthy)
                .join(' ');

            log.faint('Building...');
            await runShellCommand(buildCommand, {
                env: {
                    ...process.env,
                    VITE_CJS_IGNORE_WARNING: 'true',
                },
            });

            log.faint('Creating 404 page...');
            const indexPath = join(outDir, 'index.html');
            const dist404Path = join(outDir, '404.html');

            await cp(indexPath, dist404Path);

            /** Run preview. */
            if (usedCommands.frontend.subCommands.preview) {
                const previewCommand = [
                    ...baseViteCommands,
                    'preview',
                    ...filteredArgs,
                    ...configArgs,
                ]
                    .filter(check.isTruthy)
                    .join(' ');
                log.faint('Previewing...');
                await runShellCommand(previewCommand, {
                    env: {
                        ...process.env,
                        VITE_CJS_IGNORE_WARNING: 'true',
                    },
                });
            }
        } else {
            const devCommand = [
                ...baseViteCommands,
                '--force',
                ...filteredArgs,
                ...configArgs,
            ]
                .filter(check.isTruthy)
                .join(' ');

            await runShellCommand(devCommand, {
                env: {
                    ...process.env,
                    VITE_CJS_IGNORE_WARNING: 'true',
                },
            });
        }
    },
);
