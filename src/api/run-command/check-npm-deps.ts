import {awaitedForEach, isTruthy, RequiredAndNotNullBy} from 'augment-vir';
import {runShellCommand} from 'augment-vir/dist/cjs/node-only';
import {readFile} from 'fs/promises';
import {join} from 'path';
import * as semver from 'semver';
import {Color} from '../cli-color';

export type UpdateDepsInput = Readonly<{
    repoDir: string;
    packageDir: string;
    npmDeps: ReadonlyArray<string>;
    packageBinName: string;
}>;

export async function updateDepsAsNeeded(inputs: UpdateDepsInput): Promise<void> {
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
}

async function getVersionsToUpgradeTo({
    repoDir,
    packageDir,
    npmDeps,
    packageBinName,
}: UpdateDepsInput): Promise<(string | undefined)[]> {
    const listedDeps = await runShellCommand(`npm list --depth=0 2>&1 -json`, {cwd: repoDir});

    const currentRepoDepVersions = parseCurrentDeps(listedDeps.stdout);
    const packageJson = JSON.parse((await readFile(join(packageDir, 'package.json'))).toString());
    const packageDepVersions = {
        ...packageJson.devDependencies,
        ...packageJson.dependencies,
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

type TopLevelListOutput = RequiredAndNotNullBy<ListOutput, 'dependencies'> & {name: string};

type ListOutput = {
    version: string;
    resolved: string;
    dependencies?: Record<string, Omit<ListOutput, 'name'>>;
};

function parseCurrentDeps(stdout: string): Readonly<Record<string, string>> {
    const parsedListOutput = JSON.parse(stdout) as TopLevelListOutput;
    const deps = parsedListOutput.dependencies;

    const depsAndVersions: Record<string, string> = {};

    Object.keys(deps).forEach((depName) => {
        const depValue = deps[depName];

        if (
            // ignore sub packages
            !depValue?.dependencies &&
            // just a quick check that .version also exists
            !!depValue?.version
        ) {
            depsAndVersions[depName] = depValue.version;
        }
    });

    return depsAndVersions;
}
