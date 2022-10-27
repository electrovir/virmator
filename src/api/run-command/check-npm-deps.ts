import {awaitedForEach, extractErrorMessage, isTruthy, RequiredAndNotNullBy} from 'augment-vir';
import {runShellCommand} from 'augment-vir/dist/cjs/node-only';
import {existsSync} from 'fs';
import {readFile} from 'fs/promises';
import {dirname, join, parse as parsePath} from 'path';
import * as semver from 'semver';
import {Color} from '../cli-color';

export type UpdateDepsInput = Readonly<{
    repoDir: string;
    packageDir: string;
    npmDeps: ReadonlyArray<string>;
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
            console.info(`${Color.Info}Installing ${depToInstall}...`);
            await runShellCommand(`npm i -D ${depToInstall}`, {
                cwd: inputs.repoDir,
                rejectOnError: true,
            });
        });
    } catch (error) {
        throw new Error(`Failed to update deps: ${extractErrorMessage(error)}`);
    }
}

async function getVersionsToUpgradeTo({
    repoDir,
    packageDir,
    npmDeps,
    packageBinName,
}: UpdateDepsInput): Promise<(string | undefined)[]> {
    const packageName = (
        await runShellCommand(`cut -d "=" -f 2 <<< $(npm run env | grep "npm_package_name")`, {
            cwd: repoDir,
            rejectOnError: true,
        })
    ).stdout.trim();

    const listedDepsJson = await findDepsListWithPackageName(repoDir, packageName);
    const currentRepoDepVersions = parseCurrentDeps(listedDepsJson, packageName);

    const virmatorPackageJson = JSON.parse(
        (await readFile(join(packageDir, 'package.json'))).toString(),
    );
    const packageDepVersions = {
        ...virmatorPackageJson.devDependencies,
        ...virmatorPackageJson.dependencies,
    };

    return npmDeps.map((npmDep) => {
        const currentRepoVersion = currentRepoDepVersions[npmDep];
        const packageDepVersion = packageDepVersions[npmDep]
            ? semver.clean(packageDepVersions[npmDep]) ??
              semver.minVersion(packageDepVersions[npmDep])?.raw ??
              undefined
            : undefined;

        if (!packageDepVersion) {
            throw new Error(
                `No npm dep version listed for "${npmDep}" in ${packageBinName}'s dependencies.`,
            );
        }

        if (!currentRepoVersion || semver.gt(packageDepVersion, currentRepoVersion)) {
            return packageDepVersion;
        } else {
            return undefined;
        }
    });
}

async function findDepsListWithPackageName(repoDir: string, packageName: string): Promise<object> {
    if (repoDir === parsePath(process.cwd()).root) {
        return {};
    }
    if (!existsSync(join(repoDir, 'package.json'))) {
        return findDepsListWithPackageName(dirname(repoDir), packageName);
    }

    const listedDeps = await runShellCommand(`npm list --depth=0 -json`, {
        cwd: repoDir,
        rejectOnError: true,
    });
    const output = JSON.parse(listedDeps.stdout);

    if (
        output.name === packageName ||
        (packageName in output.dependencies && 'dependencies' in output.dependencies[packageName])
    ) {
        return output;
    } else {
        return findDepsListWithPackageName(dirname(repoDir), packageName);
    }
}

type TopLevelListOutput = RequiredAndNotNullBy<ListOutput, 'dependencies'> & {name: string};

type ListOutput = {
    version: string;
    resolved: string;
    dependencies?: Record<string, Omit<ListOutput, 'name'>>;
};

function parseCurrentDeps(
    objectInput: object,
    packageName: string,
): Readonly<Record<string, string>> {
    const parsedListOutput = objectInput as TopLevelListOutput;
    const deps = parsedListOutput.dependencies;

    return readDeps(deps, packageName);
}

function readDeps(rawDeps: NonNullable<ListOutput['dependencies']>, packageName: string) {
    const depsAndVersions: Record<string, string> = {};

    const nestedDeps = rawDeps[packageName]?.dependencies;
    const deps = nestedDeps ?? rawDeps;

    Object.keys(deps).forEach((depName) => {
        const depValue = deps[depName];

        if (
            depValue &&
            // ignore sub packages
            !depValue.dependencies &&
            // just a quick check that .version also exists
            !!depValue.version
        ) {
            depsAndVersions[depName] = depValue.version;
        }
    });

    return depsAndVersions;
}
