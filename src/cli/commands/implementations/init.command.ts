import {existsSync, readFile, writeFile} from 'fs-extra';
import {basename} from 'path';
import simpleGit, {SimpleGit} from 'simple-git';
import {getObjectTypedKeys} from '../../../augments/object';
import {repoRootDir} from '../../../file-paths/repo-paths';
import {CliCommandName} from '../../cli-util/cli-command-name';
import {CliFlagName} from '../../cli-util/cli-flags';
import {ConfigKey} from '../../config/config-key';
import {getRepoConfigFilePath, getVirmatorConfigFilePath} from '../../config/config-paths';
import {CliCommandImplementation, CliCommandResult, CommandFunctionInput} from '../cli-command';
import {runFormatCommand} from './format.command';
import {runUpdateAllConfigsCommand} from './update-all-configs.command';

export const initCommandImplementation: CliCommandImplementation = {
    commandName: CliCommandName.Test,
    description: `Init everything, including package.json scripts.
            If no package.json file is found, one is created and initialized.
            Pass --force to this command to overwrite current package.json scripts.`,
    implementation: runInitCommand,
    configFlagSupport: {
        [CliFlagName.NoWriteConfig]: true,
    },
};

export async function runInitCommand({
    rawArgs,
    cliFlags,
    customDir,
}: CommandFunctionInput): Promise<CliCommandResult> {
    const shouldForce = rawArgs.includes('--force');
    let error;
    try {
        await updatePackageJson(shouldForce);

        if (!cliFlags[CliFlagName.NoWriteConfig]) {
            await runUpdateAllConfigsCommand({rawArgs: [], cliFlags, customDir});
        }

        await runFormatCommand({rawArgs: [], cliFlags, customDir});
    } catch (catchError) {
        error = catchError;
    }

    return {
        success: !error,
        error: error,
    };
}

function createGitHubUrls(ref: string) {
    const repoUrl = ref.replace(/^.*github.com:/, '').replace(/\.git$/, '');
    const gitHubUrl = `https://github.com/${repoUrl}`;
    const user = repoUrl.replace(/\/[^\/]+$/, '');

    return {
        homepage: gitHubUrl,
        bugs: {
            url: `${gitHubUrl}/issues`,
        },
        repository: {
            type: 'git',
            url: `${gitHubUrl}`,
        },
        author: {
            name: user,
            url: `https://github.com/${user}`,
        },
    };
}

async function updatePackageJson(forceOverwrite: boolean) {
    const repoPackageJsonPath = getRepoConfigFilePath(ConfigKey.PackageJson);
    const virmatorPackageJsonContents = (
        await readFile(getVirmatorConfigFilePath(ConfigKey.PackageJson))
    ).toString();

    if (!existsSync(repoPackageJsonPath)) {
        await writeFile(repoPackageJsonPath, virmatorPackageJsonContents);
    }

    const virmatorPackageJson = JSON.parse(virmatorPackageJsonContents);
    // this is heavily mutated below
    const repoPackageJson = JSON.parse((await readFile(repoPackageJsonPath)).toString());

    if ('scripts' in repoPackageJson) {
        Object.keys(virmatorPackageJson.scripts).forEach((scriptName) => {
            if (!(scriptName in repoPackageJson.scripts) || forceOverwrite) {
                repoPackageJson.scripts[scriptName] = virmatorPackageJson.scripts[scriptName];
            }
        });
    } else {
        repoPackageJson.scripts = virmatorPackageJson.scripts;
    }

    if (!('name' in repoPackageJson)) {
        repoPackageJson.name = basename(repoRootDir);
    }

    const git: SimpleGit = simpleGit();
    const remotes = await git.getRemotes(true);
    const originRemote = remotes.find((remote) => remote.name === 'origin') || remotes[0];
    if (originRemote && originRemote.refs.fetch.includes('github.com')) {
        const repoProperties = createGitHubUrls(originRemote.refs.fetch);
        getObjectTypedKeys(repoProperties).forEach((packageKey) => {
            if (!(packageKey in repoPackageJson) || forceOverwrite) {
                repoPackageJson[packageKey] = repoProperties[packageKey];
            }
        });
    }

    await writeFile(repoPackageJsonPath, repoPackageJson);
}
