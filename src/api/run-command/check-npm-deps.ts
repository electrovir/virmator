import {
    awaitedForEach,
    extractErrorMessage,
    isTruthy,
    RequiredAndNotNullBy,
} from '@augment-vir/common';
import {log, readJson, runShellCommand} from '@augment-vir/node-js';
import {existsSync} from 'fs';
import {readFile} from 'fs/promises';
import {dirname, join} from 'path';
import * as semver from 'semver';
import {PackageJson} from 'type-fest';
import {systemRootPath} from '../../augments/fs';
import {DefineCommandInputs, NpmDep, NpmDepTypeEnum} from '../command/define-command-inputs';

export type UpdateDepsInput = Readonly<{
    repoDir: string;
    packageDir: string;
    npmDeps: DefineCommandInputs['npmDeps'];
    packageBinName: string;
}>;

export async function updateDepsAsNeeded(inputs: UpdateDepsInput): Promise<void> {
    try {
        const upgradeVersions = await getVersionsToUpgradeTo(inputs);
        const depsToUpdate = upgradeVersions.filter(isTruthy);

        await awaitedForEach(depsToUpdate, async (depDetails) => {
            const depToInstall = `${depDetails.name}@${depDetails.exactVersion}`;
            log.info(`Installing ${depToInstall}...`);
            await runShellCommand(
                `npm i ${depDetails.type === NpmDepTypeEnum.Dev ? '-D' : ''} ${depToInstall}`,
                {
                    cwd: inputs.repoDir,
                    rejectOnError: true,
                },
            );
        });
    } catch (error) {
        throw new Error(`Failed to update deps: ${extractErrorMessage(error)}`);
    }
}

function cleanDepVersion(input: string | undefined): string | undefined {
    if (input === '*') {
        return '*';
    }

    return input ? semver.clean(input) ?? semver.minVersion(input)?.raw ?? undefined : undefined;
}

async function getVersionsToUpgradeTo({
    repoDir,
    packageDir,
    npmDeps: neededNpmDeps,
    packageBinName,
}: UpdateDepsInput): Promise<
    ((NpmDep & {cleanVersion: string; exactVersion: string}) | undefined)[]
> {
    const packageName = (
        await runShellCommand(`cut -d "=" -f 2 <<< $(npm run env | grep "npm_package_name")`, {
            cwd: repoDir,
            rejectOnError: true,
        })
    ).stdout.trim();

    const currentRepoDepVersions = await getDeps(repoDir, packageName);

    const virmatorPackageJson = JSON.parse(
        (await readFile(join(packageDir, 'package.json'))).toString(),
    );
    const packageDepVersions: Record<string, string> = {
        ...virmatorPackageJson.devDependencies,
        ...virmatorPackageJson.dependencies,
    };

    return neededNpmDeps.map(
        (npmDep): (NpmDep & {cleanVersion: string; exactVersion: string}) | undefined => {
            const currentRepoVersion = cleanDepVersion(currentRepoDepVersions[npmDep.name]);
            const virmatorDepVersion = packageDepVersions[npmDep.name];
            const cleanVirmatorDepVersion = cleanDepVersion(virmatorDepVersion);

            if (!cleanVirmatorDepVersion || !virmatorDepVersion) {
                throw new Error(
                    `No npm dep version listed for "${npmDep.name}" in ${packageBinName}'s dependencies.`,
                );
            }

            if (
                currentRepoVersion !== '*' &&
                (!currentRepoVersion ||
                    semver.gt(cleanVirmatorDepVersion, currentRepoVersion) ||
                    (virmatorDepVersion.match(/^\d/) &&
                        cleanVirmatorDepVersion !== currentRepoVersion))
            ) {
                return {
                    ...npmDep,
                    cleanVersion: cleanVirmatorDepVersion,
                    exactVersion: virmatorDepVersion,
                };
            } else {
                return undefined;
            }
        },
    );
}

async function getDeps(
    repoDir: string,
    packageName: string,
): Promise<Readonly<Record<string, string>>> {
    if (repoDir === systemRootPath) {
        return {};
    }

    const packageJsonPath = join(repoDir, 'package.json');

    if (!existsSync(packageJsonPath)) {
        return getDeps(dirname(repoDir), packageName);
    }

    const packageJson: PackageJson | undefined = await readJson(packageJsonPath);

    const allDeps = {
        ...(packageJson?.dependencies ?? {}),
        ...(packageJson?.devDependencies ?? {}),
    };

    return allDeps as RequiredAndNotNullBy<typeof allDeps, string>;
}
