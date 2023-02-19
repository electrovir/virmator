import {
    awaitedForEach,
    extractErrorMessage,
    isTruthy,
    RequiredAndNotNullBy,
} from '@augment-vir/common';
import {logColors, readJson, runShellCommand} from '@augment-vir/node-js';
import {existsSync} from 'fs';
import {readFile} from 'fs/promises';
import {dirname, join} from 'path';
import * as semver from 'semver';
import {PackageJson} from 'type-fest';
import {systemRootPath} from '../../augments/fs';
import {DefineCommandInputs} from '../command/define-command-inputs';

export type UpdateDepsInput = Readonly<{
    repoDir: string;
    packageDir: string;
    npmDeps: DefineCommandInputs['npmDeps'];
    packageBinName: string;
}>;

export async function updateDepsAsNeeded(inputs: UpdateDepsInput): Promise<void> {
    try {
        const upgradeVersions = await getVersionsToUpgradeTo(inputs);
        const depsToUpdate = inputs.npmDeps
            .map((npmDep, index) => {
                const version = upgradeVersions[index];
                if (version) {
                    return {
                        npmDep,
                        version,
                    };
                } else {
                    return undefined;
                }
            })
            .filter(isTruthy);

        await awaitedForEach(depsToUpdate, async (depDetails) => {
            const depToInstall = `${depDetails.npmDep}@${depDetails.version}`;
            console.info(`${logColors.info}Installing ${depToInstall}...`);
            await runShellCommand(`npm i -D ${depToInstall}`, {
                cwd: inputs.repoDir,
                rejectOnError: true,
            });
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
}: UpdateDepsInput): Promise<(string | undefined)[]> {
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
    const packageDepVersions = {
        ...virmatorPackageJson.devDependencies,
        ...virmatorPackageJson.dependencies,
    };

    return neededNpmDeps.map((npmDep) => {
        const currentRepoVersion = cleanDepVersion(currentRepoDepVersions[npmDep]);
        const virmatorDepVersion = cleanDepVersion(packageDepVersions[npmDep]);

        if (!virmatorDepVersion) {
            throw new Error(
                `No npm dep version listed for "${npmDep}" in ${packageBinName}'s dependencies.`,
            );
        }

        if (
            currentRepoVersion !== '*' &&
            (!currentRepoVersion ||
                semver.gt(virmatorDepVersion, currentRepoVersion) ||
                (packageDepVersions[npmDep].match(/^\d/) &&
                    virmatorDepVersion !== currentRepoVersion))
        ) {
            return virmatorDepVersion;
        } else {
            return undefined;
        }
    });
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
