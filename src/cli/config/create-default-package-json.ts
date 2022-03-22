import {readFile} from 'fs/promises';
import {basename} from 'path';
import simpleGit, {SimpleGit} from 'simple-git';
import {ConfigKey} from './config-key';
import {getVirmatorConfigFilePath} from './config-paths';

export async function createDefaultPackageJson(repoDir: string) {
    const virmatorPackageJson: {scripts: object} = JSON.parse(
        (await readFile(getVirmatorConfigFilePath(ConfigKey.PackageJson, false))).toString(),
    );

    const gitProperties = await getGitProperties(repoDir);

    return {
        ...virmatorPackageJson,
        ...gitProperties,
        name: basename(repoDir),
    };
}

async function getGitProperties(
    repoDir: string,
): Promise<Partial<ReturnType<typeof createGitHubUrls>>> {
    const git: SimpleGit = simpleGit(repoDir);
    const remotes = await git.getRemotes(true);
    const originRemote = remotes.find((remote) => remote.name === 'origin') || remotes[0];
    if (originRemote && originRemote.refs.fetch.includes('github.com')) {
        return createGitHubUrls(originRemote.refs.fetch);
    } else {
        return {};
    }
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
