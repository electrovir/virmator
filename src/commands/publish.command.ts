import {awaitedForEach, getObjectTypedKeys, joinWithFinalConjunction} from 'augment-vir';
import {runShellCommand} from 'augment-vir/dist/cjs/node-only';
import {existsSync} from 'fs';
import {writeFile} from 'fs/promises';
import glob from 'glob';
import {basename, dirname, join} from 'path';
import {inc, ReleaseType} from 'semver';
import {defineCommand} from '../api/command/define-command';
import {askQuestionUntilConditionMet} from '../augments/console';
import {doChangesExist} from '../augments/git';
import {CleanPackageJson, readPackageJson, readTopLevelPackageJson} from '../augments/npm';

export const publishCommandDefinition = defineCommand(
    {
        commandName: 'publish',
        subCommandDescriptions: {},
        configFiles: {},
        npmDeps: [],
    } as const,
    ({commandName, packageBinName}) => {
        return {
            sections: [
                {
                    title: '',
                    content: `Publish an npm package. Includes workspace support.`,
                },
            ],
            examples: [
                {
                    title: 'publish a package',
                    content: `${packageBinName} ${commandName}`,
                },
            ],
        };
    },
    async (inputs) => {
        const {packageJson, path: packageJsonPath} = await readTopLevelPackageJson(inputs.repoDir);

        if (await doChangesExist(dirname(packageJsonPath))) {
            throw new Error(
                `git changes detected in "${packageJsonPath}". Cannot run publish command with changes, commit them first.`,
            );
        }

        const workspaceDirs = getWorkspaceDirs(packageJson, packageJsonPath);
        await updateWorkspaceVersions(packageJsonPath, workspaceDirs);
        if (await isCurrentVersionPublished(packageJson, workspaceDirs)) {
            await bumpPackageVersion(packageJson, packageJsonPath);
        }
        await updateWorkspaceVersions(packageJsonPath, workspaceDirs);
        await runShellCommand(`npm i`, {
            rejectOnError: true,
            cwd: dirname(packageJsonPath),
        });

        await publishPackages(workspaceDirs, packageJsonPath);

        await updateGit(packageJsonPath);

        return {
            success: true,
        };
    },
);

async function updateGit(packageJsonPath: string): Promise<void> {
    const newVersion: string = (await readPackageJson(packageJsonPath)).version;
    const packageDirPath = dirname(packageJsonPath);

    if (await doChangesExist(packageDirPath)) {
        await runShellCommand(`git commit -a --amend --no-edit`, {
            cwd: packageDirPath,
            rejectOnError: true,
        });
    }

    await runShellCommand(`git tag v${newVersion} && git push && git push --tags`, {
        cwd: packageDirPath,
        rejectOnError: true,
    });
}

async function updateWorkspaceVersions(
    packageJsonPath: string,
    workspaceDirPaths: ReadonlyArray<string>,
): Promise<void> {
    const newVersion = (await readPackageJson(packageJsonPath)).version;

    await awaitedForEach(workspaceDirPaths, async (workspacePath) => {
        const workspacePackageJsonPath = join(workspacePath, 'package.json');
        const workspacePackageJson = await readPackageJson(workspacePackageJsonPath);
        const newWorkspacePackageJson = {...workspacePackageJson};
        newWorkspacePackageJson.version = newVersion;
        await writeFile(
            workspacePackageJsonPath,
            JSON.stringify(newWorkspacePackageJson, null, 4) + '\n',
        );
    });
}

async function publishPackages(workspaceDirPaths: ReadonlyArray<string>, packageJsonPath: string) {
    const packagePath = dirname(packageJsonPath);
    if (workspaceDirPaths.length) {
        await awaitedForEach(workspaceDirPaths, async (workspaceDirPath) => {
            const workspacePackageJson = await readPackageJson(
                join(workspaceDirPath, 'package.json'),
            );
            if (!workspacePackageJson.private) {
                console.info(`\nPublishing ${basename(workspaceDirPath)}`);
                await runShellCommand(`npm publish`, {
                    rejectOnError: true,
                    cwd: workspaceDirPath,
                    hookUpToConsole: true,
                    env: {
                        ...process.env,
                        NPM_CONFIG_COLOR: 'always',
                    },
                });
            }
        });
    } else {
        await runShellCommand(`npm publish`, {
            rejectOnError: true,
            cwd: packagePath,
            hookUpToConsole: true,
            env: {
                ...process.env,
                NPM_CONFIG_COLOR: 'always',
            },
        });
    }
}

async function isCurrentVersionPublished(
    packageJson: CleanPackageJson,
    workspaceDirs: ReadonlyArray<string>,
): Promise<boolean> {
    const arePublished = await Promise.all(
        workspaceDirs.map(async (workspaceDirPath) => {
            const workspacePackageJson = await readPackageJson(
                join(workspaceDirPath, 'package.json'),
            );
            return await isPublished(workspacePackageJson);
        }),
    );

    return arePublished.some((entry) => entry) || (await isPublished(packageJson));
}

async function isPublished({name, version}: {name: string; version: string}) {
    const output = await runShellCommand(`npm show ${name}@${version}`);
    return output.exitCode === 0;
}

// this is just used to ensure we have every release type
const releaseTypesObject: Readonly<{[Prop in ReleaseType]: Prop}> = {
    major: 'major',
    premajor: 'premajor',
    minor: 'minor',
    preminor: 'preminor',
    patch: 'patch',
    prepatch: 'prepatch',
    prerelease: 'prerelease',
} as const;

const releaseTypeOptions = getObjectTypedKeys(releaseTypesObject);
const releaseTypeMessage = `Choose a release type: ${joinWithFinalConjunction(
    releaseTypeOptions as string[],
    'or',
)}:`;

async function bumpPackageVersion(
    packageJson: CleanPackageJson,
    packageJsonPath: string,
): Promise<void> {
    const releaseType: ReleaseType = (await askQuestionUntilConditionMet({
        conditionCallback: (input) => {
            return (releaseTypeOptions as string[]).includes(input.toLowerCase());
        },
        invalidInputMessage: `Invalid release type. Expected ${joinWithFinalConjunction(
            releaseTypeOptions as string[],
            'or',
        )}.`,
        questionToAsk: releaseTypeMessage,
        timeoutMs: 0,
    })) as ReleaseType;
    const newVersion = inc(packageJson.version, releaseType);
    if (!newVersion) {
        throw new Error(
            `New version was not calculated from version "${packageJson.version}" and release type "${releaseType}"`,
        );
    }

    const newPackageJson = {
        ...packageJson,
    };
    // assign this after the const assignment above so we don't change the key ordering
    newPackageJson.version = newVersion;

    await writeFile(packageJsonPath, JSON.stringify(newPackageJson, null, 4) + '\n');
}

function getWorkspaceDirs(
    packageJson: CleanPackageJson,
    packageJsonPath: string,
): ReadonlyArray<string> {
    if (!packageJson.workspaces) {
        return [];
    }

    const paths: ReadonlyArray<string> = packageJson.workspaces
        .map((workspacePattern) => {
            const packageDir = dirname(packageJsonPath);
            const exactPath = join(packageDir, workspacePattern);
            if (existsSync(exactPath)) {
                return exactPath;
            } else {
                return glob.sync(workspacePattern, {
                    cwd: packageDir,
                });
            }
        })
        .flat()
        .sort();

    return paths;
}
