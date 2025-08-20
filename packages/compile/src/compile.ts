import {check} from '@augment-vir/assert';
import {logColors, RuntimeEnv} from '@augment-vir/common';
import {
    copyConfigFile,
    defineVirmatorPlugin,
    NpmDepType,
    PackageType,
    parseTsConfig,
    type VirmatorPluginExecutorParams,
} from '@virmator/core';
import {rm} from 'node:fs/promises';
import {basename, join} from 'node:path';
import {type ColorKey, createCommandLogPrefix} from 'runstorm';

/** A virmator plugin for compiling TypeScript. */
export const virmatorCompilePlugin = defineVirmatorPlugin(
    import.meta.dirname,
    {
        name: 'TS Compile',
        cliCommands: {
            compile: {
                doc: {
                    sections: [
                        `
                            Type checks TypeScript files and compiles them into JS outputs using the
                            TypeScript compiler. Any extra args are passed directly to tsc.
                        `,
                        `
                            Automatically compiles a mono-repo's sub packages in the correct order
                            if called from a mono-repo root.
                        `,
                    ],
                    examples: [
                        {
                            content: 'virmator compile',
                        },
                        {
                            title: 'With tsc flags',
                            content: 'virmator compile --noEmit',
                        },
                    ],
                },
                configFiles: {
                    tsconfigPackage: {
                        copyFromPath: join('configs', 'tsconfig.package.json'),
                        copyToPath: 'tsconfig.json',
                        env: {
                            [RuntimeEnv.Node]: true,
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.TopPackage]: true,
                        },
                        required: true,
                    },
                    tsconfigMonoPackage: {
                        copyFromPath: join('configs', 'tsconfig.mono-package.json'),
                        copyToPath: 'tsconfig.json',
                        env: {
                            [RuntimeEnv.Node]: true,
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.MonoPackage]: true,
                        },
                        required: true,
                    },
                    tsconfigMono: {
                        copyFromPath: join('configs', 'tsconfig.mono.json'),
                        copyToPath: join('configs', 'tsconfig.base.json'),
                        env: {
                            [RuntimeEnv.Node]: true,
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.MonoRoot]: true,
                        },
                        required: true,
                    },
                },
                npmDeps: {
                    typescript: {
                        type: NpmDepType.Dev,
                        env: {
                            [RuntimeEnv.Node]: true,
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.TopPackage]: true,
                        },
                    },
                    'mono-vir': {
                        type: NpmDepType.Dev,
                        env: {
                            [RuntimeEnv.Node]: true,
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.MonoRoot]: true,
                        },
                    },
                },
            },
        },
    },
    async (params) => {
        const {
            package: {packageType},
            log,
            runShellCommand,
            runPerPackage,
            configs,
        } = params;

        if (packageType === PackageType.MonoRoot) {
            await runPerPackage(async ({packageCwd, packageName, color}) => {
                await copyConfigFile(
                    {
                        ...configs.compile.configs.tsconfigMonoPackage,
                        fullCopyToPath: join(packageCwd, 'tsconfig.json'),
                    },
                    log,
                    false,
                    undefined,
                    packageName,
                );
                return await createCompileCommandString(
                    {...params, cwd: packageCwd},
                    packageName,
                    color,
                );
            }, 'tree');
        } else {
            await runShellCommand(await createCompileCommandString(params, undefined));
        }
    },
);

async function createCompileCommandString(
    {cwd, cliInputs, log}: Pick<VirmatorPluginExecutorParams<any>, 'cwd' | 'cliInputs' | 'log'>,
    packageName: string | undefined,
    color?: ColorKey | undefined,
): Promise<string> {
    const tsconfig = parseTsConfig(cwd);
    const outDir = tsconfig?.options.outDir;

    const logPrefix =
        packageName && color
            ? [
                  createCommandLogPrefix({
                      name: packageName,
                      color,
                  }),
                  logColors.faint,
              ].join('')
            : '';

    if (outDir) {
        log.faint(`${logPrefix}Deleting ${basename(outDir)}...`);

        await rm(outDir, {force: true, recursive: true});
    }
    log.faint(`${logPrefix}Deleting tsconfig.tsbuildinfo...`);
    await rm(join(cwd, 'tsconfig.tsbuildinfo'), {force: true});

    log.faint(`${logPrefix}Compiling...`);

    const fullCommand = [
        'npx',
        'tsc',
        tsconfig?.options.composite ? '-b' : '',
        '--pretty',
        ...cliInputs.filteredArgs,
    ].filter(check.isTruthy);

    return fullCommand.join(' ');
}
