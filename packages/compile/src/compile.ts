import {isTruthy} from '@augment-vir/common';
import {
    copyConfigFile,
    defineVirmatorPlugin,
    getNpmBinPath,
    NpmDepType,
    VirmatorPluginExecutorParams,
} from '@virmator/core';
import {parseTsConfig} from '@virmator/core/src/augments/tsconfig/parse-tsconfig';
import {PackageType, VirmatorEnv} from '@virmator/core/src/plugin/plugin-env';
import {rm} from 'node:fs/promises';
import {basename, join, relative} from 'node:path';

export const virmatorCompilePlugin = defineVirmatorPlugin(
    import.meta.dirname,
    {
        name: 'TS Compile',
        cliCommands: {
            compile: {
                doc: {
                    sections: [
                        {
                            content: `
                                Compiles and type checks TypeScript files into JS outputs using the default TypeScript compiler.
                                Assumes that the compiled output dir is 'dist'.
                                Pass any extra tsc flags to this command.
                            `,
                        },
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
                        env: [
                            VirmatorEnv.Node,
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.TopPackage,
                        ],
                        required: true,
                    },
                    tsconfigMono: {
                        copyFromPath: join('configs', 'tsconfig.mono.json'),
                        copyToPath: join('configs', 'tsconfig.base.json'),
                        env: [
                            VirmatorEnv.Node,
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.MonoRoot,
                        ],
                        required: true,
                    },
                },
                npmDeps: {
                    typescript: {
                        type: NpmDepType.Dev,
                        env: [
                            VirmatorEnv.Node,
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.TopPackage,
                        ],
                    },
                    'mono-vir': {
                        type: NpmDepType.Dev,
                        env: [
                            VirmatorEnv.Node,
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.MonoRoot,
                        ],
                    },
                },
            },
        },
    },
    async (params) => {
        const {
            package: {packageType, cwdPackagePath},
            log,
            runShellCommand,
            runPerPackage,
            configs,
        } = params;

        if (packageType === PackageType.MonoRoot) {
            await runPerPackage(async ({packageCwd, packageName}) => {
                await copyConfigFile(
                    {
                        ...configs.compile.configs.tsconfigPackage,
                        fullCopyToPath: join(packageCwd, 'tsconfig.json'),
                    },
                    log,
                    false,
                    (contents) => {
                        return contents.replace(
                            '@virmator/compile/configs/tsconfig.base.json',
                            join(
                                relative(packageCwd, cwdPackagePath),
                                configs.compile.configs.tsconfigMono.copyToPath,
                            ),
                        );
                    },
                    packageName,
                );
                return await createCompileCommandString({...params, cwd: packageCwd}, packageName);
            });
        } else {
            await runShellCommand(await createCompileCommandString(params, undefined));
        }
    },
);

async function createCompileCommandString(
    {cwd, cliInputs, log}: Pick<VirmatorPluginExecutorParams<any>, 'cwd' | 'cliInputs' | 'log'>,
    packageName: string | undefined,
): Promise<string> {
    const commandPath = await getNpmBinPath({command: 'tsc', cwd});

    const tsconfig = parseTsConfig(cwd);
    const outDir = tsconfig?.options.outDir;

    const logPrefix = packageName ? `[${packageName}] ` : '';

    if (outDir) {
        log.faint(`${logPrefix}Deleting ${basename(outDir)}...`);

        await rm(outDir, {force: true, recursive: true});
    }

    log.faint(`${logPrefix}Compiling...`);

    const fullCommand = [
        commandPath,
        tsconfig?.options.composite ? '-b -f' : '',
        '--pretty',
        ...cliInputs.filteredArgs,
    ].filter(isTruthy);

    return fullCommand.join(' ');
}
