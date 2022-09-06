import {stripColor} from 'ansi-colors';
import {awaitedForEach, isTruthy, safeMatch} from 'augment-vir';
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
    const listedDeps = await runShellCommand(`npm list --depth=0 2>&1`, {cwd: repoDir});

    const currentRepoDepVersions = parseCurrentDeps(listedDeps.stdout);
    const packageJson = JSON.parse((await readFile(join(packageDir, 'package.json'))).toString());
    const packageDepVersions = {
        ...packageJson.devDependencies,
        ...packageJson.dependencies,
    };

    return npmDeps.map((npmDep) => {
        const currentRepoVersion = currentRepoDepVersions[npmDep];
        const packageDepVersion = semver.clean(packageDepVersions[npmDep] ?? '');

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

function parseCurrentDeps(stdout: string): Readonly<Record<string, string>> {
    const lines = stdout.split('\n');
    const depLines = lines.filter((line) => line.match(/\s*[├└]─/) && !line.match(/─\s*\(empty\)/));
    const namesAndVersions = depLines.map((depLine) => {
        const nameAndVersion = safeMatch(
            stripColor(depLine),
            /\s*[├└]─+\s*(?:UNMET DEPENDENCY\s*)?(.+)$/,
        )[1];

        if (!nameAndVersion) {
            throw new Error(
                `Failed to retrieve dependency name and version from line "${depLine}"`,
            );
        }
        return nameAndVersion;
    });

    const nameToVersionMap: Record<string, string> = namesAndVersions.reduce(
        (accum, nameVersion) => {
            const [
                ,
                depName,
                depVersion,
            ] = safeMatch(nameVersion, /(.+)@(.+)/);
            const cleanedVersion = semver.clean(depVersion ?? '');
            if (!depName || !cleanedVersion) {
                console.error({depLines, namesAndVersions});
                throw new Error(`Failed to extract dep name and version from "${nameVersion}"`);
            }
            if (!semver.valid(cleanedVersion)) {
                throw new Error(`Extracted dependency version is not valid: "${cleanedVersion}"`);
            }
            accum[depName] = cleanedVersion;
            return accum;
        },
        {} as Record<string, string>,
    );

    return nameToVersionMap;
}
